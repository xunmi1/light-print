export const isIE = () => /msie|trident/i.test(window.navigator.userAgent);

export const isString = (val: unknown): val is string => typeof val === 'string';
export const isElement = <T extends Element>(target: unknown): target is T => target instanceof Element;

export const appendNode = <T extends Node>(parent: T, child: T) => parent.appendChild(child);

export const importNode = <T extends Node>(document: Document, node: T): T => document.importNode(node, true);

export const removeNode = <T extends Node>(node: T) => node.parentNode?.removeChild(node);

const SHOW_ELEMENT = window.NodeFilter.SHOW_ELEMENT;
export const createNodeIterator = (root: Node, filter?: NodeFilter) =>
  // IE requires four parameters (entityReferenceExpansion: false)
  // @ts-expect-error
  window.document.createNodeIterator(root, SHOW_ELEMENT, filter ?? null, false);

/** clone element style */
export const cloneStyle = <T extends Element>(target: T, origin: T) => {
  const style = window.getComputedStyle(origin, null);
  let styleText = '';
  for (let index = 0; index < style.length; index++) {
    const value = style.getPropertyValue(style[index]);
    if (value) styleText += `${style[index]}:${value};`;
  }

  target.setAttribute('style', styleText);
};

export const setStyleProperty = (
  target: ElementCSSInlineStyle,
  propertyName: string,
  value: number | string,
  priority?: string
) => {
  target.style.setProperty(propertyName, String(value), priority);
};

export const normalizeNode = <T extends Element>(target: unknown) => {
  if (isElement<T>(target)) return target;
  if (isString(target)) return window.document.querySelector<T>(target) ?? undefined;
};

export const bindOnceEvent = <T extends EventTarget, K extends keyof WindowEventMap>(
  el: T,
  eventName: K,
  listener: (event: WindowEventMap[K]) => void,
  options?: AddEventListenerOptions | boolean
) => {
  const wrappedListener: EventListener = event => {
    listener(event as WindowEventMap[K]);
    el.removeEventListener(eventName, wrappedListener);
  };

  el.addEventListener(eventName, wrappedListener, options);
};

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
