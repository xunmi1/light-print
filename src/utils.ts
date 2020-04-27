export const isIE = () => window.navigator.userAgent.toLowerCase().indexOf('msie') !== -1 || !!window.StyleMedia;
export const isNode = (target: unknown): target is Node => target instanceof Node;

export const appendNode = <T extends Node>(parent: T, child: T) => parent.appendChild(child);

export const importNode = <T extends Node>(document: Document, node: T): T => document.importNode(node, true);

export const removeNode = <T extends Node>(node: T) => node.parentNode?.removeChild(node);

// 复制样式
export const cloneStyle = <T extends Element>(target: T, origin: T) => {
  const style = window.getComputedStyle(origin, null);
  target.setAttribute('style', style.cssText);
};
