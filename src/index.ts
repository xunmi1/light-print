import {
  isIE,
  appendNode,
  importNode,
  removeNode,
  createNodeIterator,
  getNode,
  cloneStyle,
  getDocument,
  setProperty,
  bindOnceEvent,
} from './utils';

export interface PrintOptions {
  documentTitle?: string;
  mediaPrintStyle?: string;
  zoom?: number | string;
}

const createContainer = (documentTitle: PrintOptions['documentTitle']): HTMLIFrameElement => {
  const container = window.document.createElement('iframe');
  const hidden = 'position: absolute; height: 0; width: 0; visibility: hidden;';
  container.setAttribute('style', hidden);
  const title = documentTitle ?? window.document.title;
  container.setAttribute('srcdoc', `<html><head><title>${title}</title></head></html>`);
  return container;
};

const createStyleNode = (style: string): HTMLStyleElement => {
  const node = window.document.createElement('style');
  node.innerHTML = `@media print {${style}}`;
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

/**
 * Reset html zoom
 */
const setDocumentZoom = (document: Document, zoom: number | string = 1) => {
  setProperty(document.documentElement, 'zoom', zoom);
};

const loadContainer = (title: PrintOptions['documentTitle']) =>
  new Promise<HTMLIFrameElement>((resolve, reject) => {
    const container = createContainer(title);
    appendNode(window.document.body, container);
    bindOnceEvent(container, 'load', () => resolve(container));
    bindOnceEvent(container, 'error', () => reject(new Error('Failed to load document')));
  });

const performPrint = (container: HTMLIFrameElement) =>
  new Promise<void>((resolve, reject) => {
    // required for IE
    container.focus();
    const contentWindow = container.contentWindow;
    if (!contentWindow) {
      reject(new Error('Not found window'));
      return;
    }
    if (isIE()) {
      try {
        contentWindow.document.execCommand('print', false);
      } catch {
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

const lightPrint = <T extends Node | string>(containerOrSelector: T, options: PrintOptions = {}) => {
  const dom = getNode(containerOrSelector);
  if (!dom) throw new Error('Invalid HTML element');

  return loadContainer(options.documentTitle).then(container => {
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
    return performPrint(container);
  });
};

export default lightPrint;
