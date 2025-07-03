import {
  isIE,
  appendNode,
  importNode,
  removeNode,
  normalizeNode,
  setStyleProperty,
  bindOnceEvent,
  withResolvers,
} from './utils';
import { importFonts } from './fonts';
import { waitResources } from './resources';
import { cloneDocument } from './clone';
import { createContext, type Context } from './context';

export interface PrintOptions {
  /** The title of the document. */
  documentTitle?: string;
  /** The additional style of the document. */
  mediaPrintStyle?: string;
  /** The zoom of the document. */
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

/**
 * Print the HTML element.
 * @param containerOrSelector An actual HTML element or a CSS selector.
 * @param options Print options.
 */
function lightPrint(containerOrSelector: Element | string, options: PrintOptions = {}): Promise<void> {
  const target = normalizeNode(containerOrSelector);
  // ensure to return a rejected promise.
  if (!target) return Promise.reject(new Error('Invalid HTML element.'));

  const container = createContainer();
  // must be mounted and loaded before using `contentWindow` for Firefox.
  return mount(container, window.document.body).then(() => {
    const printDocument = container.contentWindow?.document;
    if (!printDocument) throw new Error('Not found document.');

    const context = createContext(container.contentWindow);

    printDocument.title = options.documentTitle ?? window.document.title;
    setStyleProperty(printDocument.documentElement, 'zoom', options.zoom ?? 1);
    // remove the default margin.
    setStyleProperty(printDocument.body, 'margin', 0);
    importFonts(context.window);

    appendNode(printDocument.body, importNode(printDocument, target));
    // Resources can affect the size of elements (e.g. `<img>`).
    return waitResources(context.window)
      .then(() => {
        cloneDocument(context, target);
        // Style of highest priority.
        context.appendStyle(options.mediaPrintStyle);
        // Insert after all styles have been generated.
        context.mountStyle();
        return emitPrint(container);
      })
      .finally(() => {
        // The container can only be destroyed after the printing process has been completed.
        removeNode(container);
      });
  });
}

export default lightPrint;
