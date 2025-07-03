import { isIE, appendNode, removeNode, normalizeNode, setStyleProperty, bindOnceEvent, withResolvers } from './utils';
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

function emitPrint(contentWindow: Window) {
  const { promise, resolve } = withResolvers<void>();
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
  const hostElement = normalizeNode(containerOrSelector);
  // ensure to return a rejected promise.
  if (!hostElement) return Promise.reject(new Error('Invalid HTML element.'));

  const container = createContainer();
  // must be mounted and loaded before using `contentWindow` for Firefox.
  return mount(container, window.document.body)
    .then(() => {
      if (!container.contentWindow?.document) throw new Error('Not found document.');

      const context = createContext(container.contentWindow);

      context.document.title = options.documentTitle ?? window.document.title;
      setStyleProperty(context.document.documentElement, 'zoom', options.zoom ?? 1);
      // remove the default margin.
      setStyleProperty(context.document.body, 'margin', 0);
      importFonts(context.document);

      appendNode(context.document.body, context.document.importNode(hostElement, true));
      // Resources can affect the size of elements (e.g. `<img>`).
      return waitResources(context.document).then(() => {
        cloneDocument(context, hostElement);
        // Style of highest priority.
        context.appendStyle(options.mediaPrintStyle);
        // Mount after all styles have been generated.
        context.mountStyle();
        return emitPrint(context.window);
      });
    })
    .finally(() => {
      // The container can only be destroyed after the printing process has been completed.
      removeNode(container);
    });
}

export default lightPrint;
