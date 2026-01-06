export const isIE = () => /msie|trident/i.test(window.navigator.userAgent);

export const isString = (val: unknown): val is string => typeof val === 'string';

export const isElement = <T extends Element>(target: unknown): target is T => target instanceof Element;

export function includes<T>(value: T, array: readonly T[]) {
  // Need to be compatible with `IE`
  return array.indexOf(value) >= 0;
}

export function appendNode<T extends Node>(parent: T, child: T) {
  parent.appendChild(child);
}

export function removeNode<T extends Node>(node: T) {
  node.parentNode?.removeChild(node);
}

type SafeGet<Key, Map> = Key extends keyof Map ? Map[Key] : never;

export type ElementNameMap = {
  [K in keyof (HTMLElementTagNameMap & SVGElementTagNameMap & MathMLElementTagNameMap)]:
    | SafeGet<K, HTMLElementTagNameMap>
    | SafeGet<K, SVGElementTagNameMap>
    | SafeGet<K, MathMLElementTagNameMap>;
};

export function whichElement<T extends keyof ElementNameMap>(el: Element, name: T): el is ElementNameMap[T] {
  return el.localName === name;
}

export function isMediaElement(el: Element) {
  return whichElement(el, 'audio') || whichElement(el, 'video');
}

// `slot`, `style`, etc. default to `display: none` but can still be rendered if override their display.
const NON_RENDERING_ELEMENTS = ['source', 'track', 'wbr'] as const;
export function isRenderingElement(el: Element) {
  return !includes(el.localName, NON_RENDERING_ELEMENTS);
}

export function isHidden(style: CSSStyleDeclaration) {
  return !style.display || style.display === 'none';
}

type ExternalStyleElement = HTMLStyleElement | (HTMLLinkElement & { rel: 'stylesheet' });

export function isExternalStyleElement(el: Element): el is ExternalStyleElement {
  return whichElement(el, 'style') || (whichElement(el, 'link') && el.rel === 'stylesheet');
}

/**
 * @internal
 * Exporting this constant is solely for the convenience of testing.
 */
export const BLOCK_CONTAINER_DISPLAY = [
  'block',
  'inline-block',
  'list-item',
  'flow-root',
  'table-caption',
  'table-cell',
  'table-column',
  'table-column-group',
] as const;
/** Block container
 * @see https://developer.mozilla.org/docs/Web/CSS/CSS_display/Visual_formatting_model#block_containers
 */
export function isBlockContainer(style: CSSStyleDeclaration) {
  return includes(style.display, BLOCK_CONTAINER_DISPLAY);
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
type EventFor<T, K extends EventName<T>> = EventMap<T>[K];

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

export function getOwnerWindow(element: Element) {
  return element.ownerDocument.defaultView!;
}

// Equal to: HTMLElement | SVGElement | MathMLElement
export type ElementWithStyle = Element & ElementCSSInlineStyle;

export interface ElementWalker<Root extends Node> extends TreeWalker {
  currentNode: Element | Root;
  nextNode(): Element | null;
  nextSibling(): Element | null;
  parentNode(): Element | null;
}

function createElementWalker<T extends Node>(root: T) {
  // `1` is `NodeFilter.SHOW_ELEMENT`
  // IE requires four parameters (expandEntityReferences: false)
  // @ts-expect-error
  return window.document.createTreeWalker(root, 1, null, false) as ElementWalker<T>;
}

export function traverse<T extends ParentNode>(
  visitor: <U extends Element | T>(target: U, origin: U) => boolean,
  target: T,
  origin: T
) {
  const targetWalker = createElementWalker(target);
  const originWalker = createElementWalker(origin);
  while (true) {
    const isNext = visitor(targetWalker.currentNode, originWalker.currentNode);
    if (isNext) {
      if (!(targetWalker.nextNode() && originWalker.nextNode())) break;
    } else {
      const skippedNode = targetWalker.currentNode;
      let hasParent = true;
      while (true) {
        const hasSibling = targetWalker.nextSibling() && originWalker.nextSibling();
        if (hasSibling) break;
        // If the current element has no next sibling, move to the next sibling of its parent.
        hasParent = !!(targetWalker.parentNode() && originWalker.parentNode());
        if (!hasParent) break;
      }
      // Remove the skipped element and its subtree, to prevent any resources from being loaded.
      removeNode(skippedNode);
      if (!hasParent) break;
    }
  }
}
