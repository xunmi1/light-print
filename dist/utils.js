export const isIE = () => window.navigator.userAgent.toLowerCase().indexOf('msie') !== -1 || !!window.StyleMedia;
export const appendNode = (parent, child) => parent.appendChild(child);
export const importNode = (document, node) => document.importNode(node, true);
export const removeNode = (node) => node.parentNode?.removeChild(node);
export const cloneStyle = (target, origin) => {
    const style = window.getComputedStyle(origin, null);
    target.setAttribute('style', style.cssText);
};
export const isNode = (target) => target instanceof Node;
