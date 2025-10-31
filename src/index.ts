import { isIE, appendNode, removeNode, normalizeNode, setStyleProperty, bindOnceEvent, withResolvers } from './utils';
import { tryImportFonts } from './fonts';
import { waitResources } from './resources';
import { cloneDocument } from './clone';
import { createContext } from './context';

export interface PrintOptions {
  /** Document title */
  documentTitle?: string;
  /** Additional print styles */
  mediaPrintStyle?: string;
  /** Document zoom level */
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
  // When the browser’s network cache is disabled,
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
  const context = createContext();
  // must be mounted and loaded before using `contentWindow` for Firefox.
  return mount(container, window.document.body)
    .then(() => {
      const doc = container.contentWindow!.document;
      context.bind(doc);

      doc.title = options.documentTitle ?? window.document.title;
      setStyleProperty(doc.documentElement, 'zoom', options.zoom ?? 1);
      // remove the default margin.
      setStyleProperty(doc.body, 'margin', 0);

      tryImportFonts(doc);
      cloneDocument(context, hostElement);
      // style of highest priority.
      context.appendStyle(options.mediaPrintStyle);
      // mount after all styles have been generated.
      context.mountStyle();
    })
    .then(() => waitResources(context.document))
    .then(() => emitPrint(context.document.defaultView!))
    .finally(() =>
      // The container can only be destroyed after the printing process has been completed.
      removeNode(container)
    );
}

export default lightPrint;
