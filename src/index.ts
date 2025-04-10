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
  getSharedStyleNode,
  resetSharedStyleNode,
} from './utils';
import { waitResources } from './resources';
import { markPrintId, resetPrintId } from './printId';
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
  setStyleProperty(container, 'transform', 'scale(0)', 'important');
  return container;
}

function cloneDocument(printDocument: Document, dom: Node) {
  const originIterator = createNodeIterator(dom);
  // start from `body` node
  const printIterator = createNodeIterator(printDocument.body);
  // skip `body` node
  printIterator.nextNode();
  while (true) {
    const node = printIterator.nextNode() as Element | null;
    const originNode = originIterator.nextNode() as Element | null;

    if (originNode && node) {
      markPrintId(node);
      cloneNode(node, originNode);
    } else break;
  }
  resetPrintId();
}

function mount(container: HTMLIFrameElement, parent: Element) {
  const { promise, resolve, reject } = withResolvers<void>();
  bindOnceEvent(container, 'load', () => resolve());
  bindOnceEvent(container, 'error', () => reject(new Error('Failed to mount document.')));
  appendNode(parent, container);
  return promise;
}

function emitPrint(container: HTMLIFrameElement) {
  const { promise, resolve } = withResolvers<void>();
  const contentWindow = container.contentWindow!;
  // required for IE
  contentWindow.focus();
  // When the browser's network cache is disabled,
  // the execution end time of `print()` will be later than the `afterprint` event.
  // Conversely, the 'afterprint' event will be fired later.
  // Thus, both need to be completed to indicate that the printing process has ended.
  bindOnceEvent(contentWindow, 'afterprint', () => resolve());

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

    appendNode(printDocument.body, importNode(printDocument, dom));
    // Resources can affect the size of elements (e.g. `<img>`).
    return waitResources(container.contentWindow)
      .then(() => {
        cloneDocument(printDocument, dom);
        const styleNode = getSharedStyleNode(printDocument);
        // Style of highest priority.
        if (options.mediaPrintStyle) styleNode.textContent += options.mediaPrintStyle;
        // Insert after all styles have been generated.
        appendNode(printDocument.head, styleNode);
        return emitPrint(container);
      })
      .finally(() => {
        // The container can only be destroyed after the printing process has been completed.
        removeNode(container);
        resetSharedStyleNode();
      });
  });
}

export default lightPrint;
