export const isIE = () => /msie|trident/i.test(window.navigator.userAgent);

export const isString = (val: unknown): val is string => typeof val === 'string';

export const isElement = <T extends Element>(target: unknown): target is T => target instanceof Element;

export const appendNode = <T extends Node>(parent: T, child: T) => parent.appendChild(child);

export const importNode = <T extends Node>(document: Document, node: T): T => document.importNode(node, true);

export const removeNode = <T extends Node>(node: T) => node.parentNode?.removeChild(node);

const SHOW_ELEMENT = window.NodeFilter.SHOW_ELEMENT;
export function createNodeIterator(root: Node, filter?: NodeFilter) {
  // IE requires four parameters (entityReferenceExpansion: false)
  // @ts-expect-error
  return window.document.createNodeIterator(root, SHOW_ELEMENT, filter ?? null, false);
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

type EventMap = WindowEventMap & DocumentEventMap;

export function bindOnceEvent<T extends EventTarget, K extends keyof EventMap>(
  el: T,
  eventName: K,
  listener: (event: EventMap[K]) => void,
  options?: AddEventListenerOptions | boolean
) {
  const wrappedListener: EventListener = event => {
    listener(event as EventMap[K]);
    el.removeEventListener(eventName, wrappedListener);
  };

  el.addEventListener(eventName, wrappedListener, options);
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

export function createStyleNode(style: string) {
  const node = window.document.createElement('style');
  node.textContent = style;
  return node;
}
