import {
  isIE,
  appendNode,
  importNode,
  removeNode,
  createNodeIterator,
  normalizeNode,
  setStyleProperty,
  bindOnceEvent,
  withResolvers,
  createStyleNode,
} from './utils';
import { waitResources } from './resources';
import { cloneNode } from './clone';

export interface PrintOptions {
  documentTitle?: string;
  mediaPrintStyle?: string;
  zoom?: number | string;
}

function createContainer() {
  const container = window.document.createElement('iframe');
  container.srcdoc = '<!DOCTYPE html>';
  setStyleProperty(container, 'position', 'absolute', 'important');
  setStyleProperty(container, 'top', '-9999px', 'important');
  setStyleProperty(container, 'visibility', 'hidden', 'important');
  return container;
}

function cloneDocument(printDocument: Document, dom: Node) {
  const originIterator = createNodeIterator(dom);
  // start from `body` node
  const printIterator = createNodeIterator(printDocument.body);
  // skip `body` node
  printIterator.nextNode();
  while (true) {
    const node = printIterator.nextNode();
    const originNode = originIterator.nextNode();
    if (originNode && node) cloneNode(node, originNode);
    else break;
  }
}

function mount(container: HTMLIFrameElement, parent: Element) {
  const { promise, resolve, reject } = withResolvers<void>();
  bindOnceEvent(container, 'load', () => resolve());
  bindOnceEvent(container, 'error', event => reject(new Error('Failed to mount document.', { cause: event })));
  appendNode(parent, container);
  return promise;
}

function emitPrint(container: HTMLIFrameElement) {
  const { promise, resolve } = withResolvers<void>();
  // required for IE
  container.focus();
  const contentWindow = container.contentWindow!;
  bindOnceEvent(container.contentWindow!, 'afterprint', () => {
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
  return promise;
}

function lightPrint(containerOrSelector: Element | string, options: PrintOptions = {}): Promise<void> {
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

    return waitResources(container.contentWindow).then(() => {
      cloneDocument(printDocument, dom);
      emitPrint(container);
    });
  });
}

export default lightPrint;
