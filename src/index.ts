import { isIE, appendNode, removeNode, normalizeNode, bindOnceEvent, withResolvers } from './utils';
import { tryImportFonts } from './fonts';
import { waitForResources } from './resources';
import { cloneDocument } from './clone';
import { createContext } from './context';

export interface PrintOptions {
  /**
   * Document title
   * @default window.document.title
   */
  documentTitle?: string;
  /**
   * Additional print styles
   *
   * @example
   * ```js
   * // A4 paper size, displayed in portrait mode.
   * const mediaPrintStyle = '@page { size: A4 portrait }'
   * ```
   */
  mediaPrintStyle?: string;
  /**
   * Document zoom level
   * @default 1
   */
  zoom?: number | string;
  /**
   * Abort signal, which can be used to abort printing.
   * @example
   * ```js
   * // Abort printing after 5 seconds
   * await lightPrint('#app', { signal: AbortSignal.timeout(5000) });
   * ```
   */
  signal?: AbortSignal;
}

interface Container extends HTMLElement {
  readonly contentDocument: Document | null;
  readonly contentWindow: Window | null;
}

function createContainer(): Container {
  const container = window.document.createElement('iframe');
  if (window.document.compatMode === 'CSS1Compat') container.srcdoc = '<!DOCTYPE html>';
  // Hide the element while preserving its layout space.
  const hiddenStyle = 'position: fixed !important; top: -9999px !important; visibility: hidden !important;';
  container.setAttribute('style', hiddenStyle);
  return container;
}

function mount(container: Container, parent: Element) {
  const { promise, resolve, reject } = withResolvers<void>();
  bindOnceEvent(container, 'load', () => resolve());
  bindOnceEvent(container, 'error', () => reject(new Error('Failed to mount document.')));
  appendNode(parent, container);
  return promise;
}

function emitPrint(contentWindow: Window) {
  const { promise, resolve } = withResolvers<void>();
  // Required for IE.
  contentWindow.focus();
  // When the browser's network cache is disabled,
  // the execution end time of `print()` will be later than the `afterprint` event.
  // Conversely, the `afterprint` event will be fired later.
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

function getAbortError(): Error {
  return new DOMException('Printing has been aborted.', 'AbortError');
}

/**
 * Print the HTML element.
 * @param containerOrSelector An actual HTML element or a CSS selector.
 * @param options Print options.
 */
function lightPrint(containerOrSelector: Element | string, options: PrintOptions = {}): Promise<void> {
  const hostElement = normalizeNode(containerOrSelector);
  // Ensure to return a rejected promise.
  if (!hostElement) return Promise.reject(new Error('Invalid HTML element.'));
  const signal = options.signal;
  if (signal?.aborted) return Promise.reject(getAbortError());

  const container = createContainer();
  const context = createContext();

  const { promise, resolve, reject } = withResolvers<void>();
  const onAbort = () => reject(getAbortError());
  const cleanup = () => {
    removeNode(container);
    signal?.removeEventListener('abort', onAbort);
  };
  signal?.addEventListener('abort', onAbort);

  // Must be mounted and loaded before using `contentWindow` or `contentDocument`.
  mount(container, window.document.body)
    .then(() => {
      const doc = container.contentDocument!;
      context.bind(doc);
      doc.title = options.documentTitle ?? window.document.title;
      // Remove the default margin.
      context.appendStyle(/* CSS */ `html{zoom:${options.zoom ?? 1}}body{margin:0;print-color-adjust:exact;}`);

      tryImportFonts(doc);
      cloneDocument(context, hostElement, options.mediaPrintStyle);
    })
    .then(() => waitForResources(context.document))
    .then(() => emitPrint(context.document.defaultView!))
    .then(resolve, reject);

  return promise.finally(cleanup);
}

export default lightPrint;
