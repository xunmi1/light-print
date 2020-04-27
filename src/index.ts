import { isIE, appendNode, importNode, removeNode, cloneStyle, isNode } from './utils';

interface Options {
  documentTitle: string;
  mediaPrintStyle: string;
  zoom: number | string;
}

export type PrintOptions = Partial<Options>;

const createContainer = (options: PrintOptions): HTMLIFrameElement => {
  const { documentTitle } = options;
  const container = window.document.createElement('iframe');
  container.setAttribute('style', ' position: absolute; height: 0; width: 0; visibility: hidden;');
  const title = documentTitle ?? window.document.title;
  container.setAttribute('srcdoc', `<html><head><title>${title}</title></head></html>`);
  return container;
};

const createStyleNode = (style: string) => {
  const node = window.document.createElement('style');
  node.innerHTML = `@media print {${style}}`;
  return node;
};

const NodeFilterType = window.NodeFilter.SHOW_ELEMENT;
/** 复制需要打印的 DOM 元素的所有样式 */
const cloneDocumentStyle = (printDocument: Document, dom: Node) => {
  cloneStyle(printDocument.body, window.document.body);
  const originIterator = window.document.createNodeIterator(dom, NodeFilterType);
  const printIterator = printDocument.createNodeIterator(printDocument.body, NodeFilterType);

  let node = printIterator.nextNode();
  while (node) {
    node = printIterator.nextNode();
    const originNode = originIterator.nextNode();
    if (originNode && node) cloneStyle(node as Element, originNode as Element);
  }
};

const getNode = (target: unknown): Node => {
  if (isNode(target)) return target;
  if (typeof target === 'string') {
    const dom = window.document.querySelector(target);
    if (dom) return dom;
  }
  throw new Error('Invalid HTML element');
};

const performPrint = (container: HTMLIFrameElement) =>
  new Promise((resolve, reject) => {
    container.focus();
    const contentWindow = container.contentWindow;
    if (!contentWindow) return reject(new Error('Not found window'));
    if (isIE()) {
      try {
        contentWindow.document.execCommand('print', false);
      } catch {
        contentWindow.print();
      }
    } else {
      contentWindow.print();
    }
    contentWindow.onafterprint = () => {
      resolve();
      contentWindow.close();
      removeNode(container);
    };
  });

const lightPrint = <T extends Node | string = string>(target: T, options: PrintOptions = {}) =>
  new Promise((resolve, reject) => {
    const dom = getNode(target);
    const container = createContainer(options);
    appendNode(window.document.body, container);
    container.addEventListener('load', () => {
      const printDocument = container.contentWindow?.document ?? container.contentDocument;
      if (!printDocument) return reject(new Error('Not found document'));
      printDocument.body.style.zoom = String(options.zoom ?? 1);
      if (options.mediaPrintStyle) {
        const styleNode = createStyleNode(options.mediaPrintStyle);
        appendNode(printDocument.head, styleNode);
      }
      appendNode(printDocument.body, importNode(printDocument, dom));
      cloneDocumentStyle(printDocument, dom);
      performPrint(container).then(resolve).catch(reject);
    });
  });

export default lightPrint;
