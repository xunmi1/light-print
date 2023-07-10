import {
  isIE,
  appendNode,
  importNode,
  removeNode,
  createNodeIterator,
  normalizeNode,
  cloneStyle,
  setStyleProperty,
  bindOnceEvent,
} from './utils';

export interface PrintOptions {
  documentTitle?: string;
  mediaPrintStyle?: string;
  zoom?: number | string;
}

const createContainer = (): HTMLIFrameElement => {
  const container = window.document.createElement('iframe');
  container.setAttribute('style', 'display: none;');
  return container;
};

const createStyleNode = (style: string): HTMLStyleElement => {
  const node = window.document.createElement('style');
  node.textContent = `@media print {${style}}`;
  return node;
};

/**
 * Copy all styles of DOM elements that need to be printed
 */
const cloneDocumentStyle = (printDocument: Document, dom: Node) => {
  const originIterator = createNodeIterator(dom);
  // start from `body`
  const printIterator = createNodeIterator(printDocument.body);

  let node = printIterator.nextNode();
  while (node) {
    node = printIterator.nextNode();
    const originNode = originIterator.nextNode();
    if (originNode && node) cloneStyle(node as Element, originNode as Element);
  }
};

const mount = (container: HTMLIFrameElement, parent: Element) =>
  new Promise<void>((resolve, reject) => {
    // bind event first, then mount node.
    bindOnceEvent(container, 'load', () => resolve());
    bindOnceEvent(container, 'error', event => reject(new Error('Failed to mount document.', { cause: event })));
    appendNode(parent, container);
  });

const emitPrint = (container: HTMLIFrameElement) =>
  new Promise<void>((resolve, reject) => {
    // required for IE
    container.focus();
    const contentWindow = container.contentWindow!;
    bindOnceEvent(contentWindow, 'afterprint', () => {
      resolve();
      // destroy window
      removeNode(container);
    });
    if (isIE()) {
      try {
        contentWindow.document.execCommand('print', false);
      } catch {
        contentWindow.print();
      }
    } else {
      contentWindow.print();
    }
  });

const lightPrint = (containerOrSelector: Element | string, options: PrintOptions = {}): Promise<void> => {
  const dom = normalizeNode(containerOrSelector);
  // ensure to return a rejected promise.
  if (!dom) return Promise.reject(new Error('Invalid HTML element.'));

  const container = createContainer();
  // must be mounted and loaded before using `contentWindow` for Firefox.
  return mount(container, window.document.body).then(() => {
    const printDocument = container.contentWindow?.document;
    if (!printDocument) throw new Error('Not found document.');

    printDocument.title = options.documentTitle ?? document.title;
    setStyleProperty(printDocument.documentElement, 'zoom', options.zoom ?? 1);
    // remove the default margin.
    setStyleProperty(printDocument.body, 'margin', 0);

    if (options.mediaPrintStyle) {
      const styleNode = createStyleNode(options.mediaPrintStyle);
      appendNode(printDocument.head, styleNode);
    }

    appendNode(printDocument.body, importNode(printDocument, dom));
    cloneDocumentStyle(printDocument, dom);

    return emitPrint(container);
  });
};

export default lightPrint;
