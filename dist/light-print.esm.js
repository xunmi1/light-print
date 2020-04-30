/*!
 * light-print v1.0.2
 * (c) 2020 xunmi
 * Released under the MIT License.
 */

function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }const isIE = () => /msie|trident/i.test(window.navigator.userAgent);

const isString = (val) => typeof val === 'string';
const isNode = (target) => target instanceof Node;

const appendNode = (parent, child) => parent.appendChild(child);

const importNode = (document, node) => document.importNode(node, true);

const removeNode = (node) => _optionalChain([node, 'access', _ => _.parentNode, 'optionalAccess', _2 => _2.removeChild, 'call', _3 => _3(node)]);

const SHOW_ELEMENT = window.NodeFilter.SHOW_ELEMENT;
const createNodeIterator = (root, filter) =>
  window.document.createNodeIterator(root, SHOW_ELEMENT, filter);

/** clone element style */
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

const getDocument = (target) => _nullishCoalesce(_optionalChain([target, 'access', _4 => _4.contentWindow, 'optionalAccess', _5 => _5.document]), () => ( target.contentDocument));

const getNode = (containerOrSelector) => {
  if (isNode(containerOrSelector)) return containerOrSelector;

  if (isString(containerOrSelector)) {
    const dom = window.document.querySelector(containerOrSelector);
    if (dom) return dom;
  }
};

const bindOnceEvent = (
  el,
  eventName,
  listener,
  options
) => {
  const wrappedListener = event => {
    listener(event );
    el.removeEventListener(eventName, wrappedListener, options);
  };

  el.addEventListener(eventName, wrappedListener, options);
};

function _nullishCoalesce$1(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } }








const createContainer = (documentTitle) => {
  const container = window.document.createElement('iframe');
  const hidden = 'position: absolute; height: 0; width: 0; visibility: hidden;';
  container.setAttribute('style', hidden);
  const title = _nullishCoalesce$1(documentTitle, () => ( window.document.title));
  container.setAttribute('srcdoc', `<html><head><title>${title}</title></head></html>`);
  return container;
};

const createStyleNode = (style) => {
  const node = window.document.createElement('style');
  node.innerHTML = `@media print {${style}}`;
  return node;
};

/** 复制需要打印的 DOM 元素的所有样式 */
const cloneDocumentStyle = (printDocument, dom) => {
  const originIterator = createNodeIterator(dom);
  // start from `body`
  const printIterator = createNodeIterator(printDocument.body);

  let node = printIterator.nextNode();
  while (node) {
    node = printIterator.nextNode();
    const originNode = originIterator.nextNode();
    if (originNode && node) cloneStyle(node , originNode );
  }
};

/** reset html zoom */
const setDocumentZoom = (document, zoom = 1) => {
  setProperty(document.documentElement, 'zoom', zoom);
};

const loadContainer = (title) =>
  new Promise((resolve, reject) => {
    const container = createContainer(title);
    appendNode(window.document.body, container);
    bindOnceEvent(container, 'load', () => resolve(container));
    bindOnceEvent(container, 'error', () => reject(new Error('Failed to load document')));
  });

const performPrint = (container) =>
  new Promise((resolve, reject) => {
    // required for IE
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

    bindOnceEvent(contentWindow, 'afterprint', () => {
      resolve();
      /** destroy window */
      contentWindow.close();
      removeNode(container);
    });
  });

const lightPrint = async ( containerOrSelector, options = {}) => {
  const dom = getNode(containerOrSelector);
  if (!dom) throw new Error('Invalid HTML element');

  const container = await loadContainer(options.documentTitle);
  const printDocument = getDocument(container);
  if (!printDocument) throw new Error('Not found document');

  setDocumentZoom(printDocument, options.zoom);

  if (options.mediaPrintStyle) {
    const styleNode = createStyleNode(options.mediaPrintStyle);
    appendNode(printDocument.head, styleNode);
  }

  appendNode(printDocument.body, importNode(printDocument, dom));
  cloneDocumentStyle(printDocument, dom);
  /** run print handler */
  await performPrint(container);
};

export default lightPrint;
//# sourceMappingURL=light-print.esm.js.map
