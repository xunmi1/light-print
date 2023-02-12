export const isIE = () => /msie|trident/i.test(window.navigator.userAgent);

export const isString = (val: unknown): val is string => typeof val === 'string';
export const isNode = (target: unknown): target is Node => target instanceof Node;

export const appendNode = <T extends Node>(parent: T, child: T) => parent.appendChild(child);

export const importNode = <T extends Node>(document: Document, node: T): T => document.importNode(node, true);

export const removeNode = <T extends Node>(node: T) => node.parentNode?.removeChild(node);

const SHOW_ELEMENT = window.NodeFilter.SHOW_ELEMENT;
export const createNodeIterator = (root: Node, filter?: NodeFilter) =>
  window.document.createNodeIterator(root, SHOW_ELEMENT, filter);

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

export const setProperty = <T extends ElementCSSInlineStyle>(
  target: T,
  propertyName: string,
  value: number | string,
  priority?: string
) => {
  target.style.setProperty(propertyName, String(value), priority);
};

export const getDocument = (target: HTMLIFrameElement) => target.contentWindow?.document ?? target.contentDocument;

export const getNode = (containerOrSelector: unknown): Node | undefined => {
  if (isNode(containerOrSelector)) return containerOrSelector;

  if (isString(containerOrSelector)) {
    const dom = window.document.querySelector(containerOrSelector);
    if (dom) return dom;
  }
};

export const bindOnceEvent = <T extends EventTarget, K extends keyof WindowEventMap>(
  el: T,
  eventName: K,
  listener: (event: WindowEventMap[K]) => void,
  options?: AddEventListenerOptions | boolean
) => {
  const wrappedListener: EventListener = event => {
    listener(event as WindowEventMap[K]);
    el.removeEventListener(eventName, wrappedListener, options);
  };

  el.addEventListener(eventName, wrappedListener, options);
};
