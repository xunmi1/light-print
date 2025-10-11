export const isIE = () => /msie|trident/i.test(window.navigator.userAgent);

export const isString = (val: unknown): val is string => typeof val === 'string';

export const isElement = <T extends Element>(target: unknown): target is T => target instanceof Element;

export const appendNode = <T extends Node>(parent: T, child: T) => parent.appendChild(child);

export const removeNode = <T extends Node>(node: T) => node.parentNode?.removeChild(node);

type SafeGet<Key, Map> = Key extends keyof Map ? Map[Key] : never;

export type ElementNameMap = {
  [K in keyof (HTMLElementTagNameMap & SVGElementTagNameMap & MathMLElementTagNameMap)]:
    | SafeGet<K, HTMLElementTagNameMap>
    | SafeGet<K, SVGElementTagNameMap>
    | SafeGet<K, MathMLElementTagNameMap>;
};

export function whichElement<T extends keyof ElementNameMap>(node: Element, name: T): node is ElementNameMap[T] {
  return node.localName === name;
}

interface ElementIterator extends NodeIterator {
  nextNode(): Element | null;
  previousNode(): Element | null;
}

const SHOW_ELEMENT = window.NodeFilter.SHOW_ELEMENT;
export function createElementIterator(root: Node, filter?: NodeFilter) {
  // IE requires four parameters (entityReferenceExpansion: false)
  // @ts-expect-error
  return window.document.createNodeIterator(root, SHOW_ELEMENT, filter ?? null, false) as ElementIterator;
}

export function setStyleProperty(
  target: ElementCSSInlineStyle,
  propertyName: string,
  value: number | string,
  priority?: string
) {
  target.style.setProperty(propertyName, String(value), priority);
}

export function normalizeNode<T extends Element>(target: unknown) {
  if (isElement<T>(target)) return target;
  if (isString(target)) return window.document.querySelector<T>(target) ?? undefined;
}

type Registry = readonly (readonly [unknown, unknown])[];
type FindRegistry<T, R extends Registry> = T extends R[0][0]
  ? R[0][1]
  : R extends [unknown, ...infer Tail extends Registry]
    ? FindRegistry<T, Tail>
    : never;

type EventMapRegistry = [
  [Window, WindowEventMap],
  [Document, DocumentEventMap],
  [HTMLVideoElement, HTMLVideoElementEventMap],
  [HTMLMediaElement, HTMLMediaElementEventMap],
  [HTMLBodyElement, HTMLBodyElementEventMap],
  [SVGSVGElement, SVGSVGElementEventMap],
  [HTMLElement, HTMLElementEventMap],
  [SVGElement, SVGElementEventMap],
  [MathMLElement, MathMLElementEventMap],
  [Element, ElementEventMap],
  [GlobalEventHandlers, GlobalEventHandlersEventMap],
  [EventTarget, Record<string, Event>],
];

type EventMap<T> = FindRegistry<T, EventMapRegistry>;
type EventName<T> = keyof EventMap<T> & string;
type EventFor<T, K extends keyof EventMap<T>> = EventMap<T>[K];

export function bindOnceEvent<Target extends EventTarget | GlobalEventHandlers, Name extends EventName<Target>>(
  target: Target,
  eventName: Name,
  listener: (event: EventFor<Target, Name>) => void,
  options?: AddEventListenerOptions | boolean
) {
  const wrappedListener: EventListener = event => {
    listener(event as EventFor<Target, Name>);
    target.removeEventListener(eventName, wrappedListener);
  };
  target.addEventListener(eventName, wrappedListener, options);
}

/**
 * `Promise.withResolvers` polyfill
 */
export function withResolvers<T>() {
  if (Promise.withResolvers != null) return Promise.withResolvers<T>();
  let resolve: PromiseWithResolvers<T>['resolve'];
  let reject: PromiseWithResolvers<T>['reject'];
  const promise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  // @ts-expect-error
  return { promise, resolve, reject };
}

export function NOOP() {}

export function getStyle(element: Element, pseudoElt?: string) {
  return element.ownerDocument.defaultView!.getComputedStyle(element, pseudoElt);
}
