/*!
 * light-print v1.0.1
 * (c) 2020 xunmi
 * Released under the MIT License.
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.LightPrint = factory());
}(this, (function () { 'use strict';

  function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }const isIE = () => window.navigator.userAgent.toLowerCase().indexOf('msie') !== -1 || !!window.StyleMedia;
  const isNode = (target) => target instanceof Node;

  const appendNode = (parent, child) => parent.appendChild(child);

  const importNode = (document, node) => document.importNode(node, true);

  const removeNode = (node) => _optionalChain([node, 'access', _ => _.parentNode, 'optionalAccess', _2 => _2.removeChild, 'call', _3 => _3(node)]);

  // 复制样式
  const cloneStyle = (target, origin) => {
    const style = window.getComputedStyle(origin, null);
    target.setAttribute('style', style.cssText);
  };

  const setProperty = (
    target,
    propertyName,
    value,
    priority
  ) => {
    target.style.setProperty(propertyName, String(value), priority);
  };

  function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain$1(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }








  const createContainer = (options) => {
    const { documentTitle } = options;
    const container = window.document.createElement('iframe');
    container.setAttribute('style', ' position: absolute; height: 0; width: 0; visibility: hidden;');
    const title = _nullishCoalesce(documentTitle, () => ( window.document.title));
    container.setAttribute('srcdoc', `<html><head><title>${title}</title></head></html>`);
    return container;
  };

  const createStyleNode = (style) => {
    const node = window.document.createElement('style');
    node.innerHTML = `@media print {${style}}`;
    return node;
  };

  const NodeFilterType = window.NodeFilter.SHOW_ELEMENT;
  /** 复制需要打印的 DOM 元素的所有样式 */
  const cloneDocumentStyle = (printDocument, dom) => {
    cloneStyle(printDocument.body, window.document.body);
    const originIterator = window.document.createNodeIterator(dom, NodeFilterType);
    const printIterator = printDocument.createNodeIterator(printDocument.body, NodeFilterType);

    let node = printIterator.nextNode();
    while (node) {
      node = printIterator.nextNode();
      const originNode = originIterator.nextNode();
      if (originNode && node) cloneStyle(node , originNode );
    }
  };

  const getNode = (target) => {
    if (isNode(target)) return target;
    if (typeof target === 'string') {
      const dom = window.document.querySelector(target);
      if (dom) return dom;
    }
    throw new Error('Invalid HTML element');
  };

  /** reset html zoom */
  const setDocumentZoom = (document, zoom = 1) => {
    setProperty(document.documentElement, 'zoom', zoom);
  };

  const performPrint = (container) =>
    new Promise((resolve, reject) => {
      container.focus();
      const contentWindow = container.contentWindow;
      if (!contentWindow) return reject(new Error('Not found window'));
      if (isIE()) {
        try {
          contentWindow.document.execCommand('print', false);
        } catch (e) {
          contentWindow.print();
        }
      } else {
        contentWindow.print();
      }

      contentWindow.onafterprint = () => {
        resolve();
        /** destroy dom */
        contentWindow.close();
        removeNode(container);
      };
    });

  const lightPrint = (target, options = {}) =>
    new Promise((resolve, reject) => {
      const dom = getNode(target);
      const container = createContainer(options);
      appendNode(window.document.body, container);
      container.addEventListener('load', () => {
        const printDocument = _nullishCoalesce(_optionalChain$1([container, 'access', _ => _.contentWindow, 'optionalAccess', _2 => _2.document]), () => ( container.contentDocument));
        if (!printDocument) return reject(new Error('Not found document'));

        setDocumentZoom(printDocument, options.zoom);
        if (options.mediaPrintStyle) {
          const styleNode = createStyleNode(options.mediaPrintStyle);
          appendNode(printDocument.head, styleNode);
        }
        appendNode(printDocument.body, importNode(printDocument, dom));
        cloneDocumentStyle(printDocument, dom);
        /** run print handler */
        performPrint(container).then(resolve).catch(reject);
      });
    });

  return lightPrint;

})));
//# sourceMappingURL=light-print.umd.js.map
