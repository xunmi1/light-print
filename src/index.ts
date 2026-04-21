import { isIE, appendNode, removeNode, normalizeNode, setStyleProperty, bindOnceEvent, withResolvers } from './utils';
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
}

interface Container extends HTMLElement {
  readonly contentDocument: Document | null;
  readonly contentWindow: Window | null;
}

function createContainer(): Container {
  const container = window.document.createElement('iframe');
  if (window.document.compatMode === 'CSS1Compat') container.srcdoc = '<!DOCTYPE html>';
  // Hide the element while preserving its layout space.
  setStyleProperty(container, 'position', 'absolute', 'important');
  setStyleProperty(container, 'top', '-9999px', 'important');
  setStyleProperty(container, 'visibility', 'hidden', 'important');
  setStyleProperty(container, 'transform', 'scale(0)', 'important');
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

/**
 * Print the HTML element.
 * @param containerOrSelector An actual HTML element or a CSS selector.
 * @param options Print options.
 */
function lightPrint(containerOrSelector: Element | string, options: PrintOptions = {}): Promise<void> {
  const hostElement = normalizeNode(containerOrSelector);
  // Ensure to return a rejected promise.
  if (!hostElement) return Promise.reject(new Error('Invalid HTML element.'));

  const container = createContainer();
  const context = createContext();
  // Must be mounted and loaded before using `contentWindow` or `contentDocument`.
  return mount(container, window.document.body)
    .then(() => {
      const doc = container.contentDocument!;
      context.bind(doc);
      doc.title = options.documentTitle ?? window.document.title;
      // Remove the default margin.
      context.appendStyle(`html{zoom:${options.zoom ?? 1}}body{margin:0;print-color-adjust:exact;}`);

      tryImportFonts(doc);
      cloneDocument(context, hostElement, options.mediaPrintStyle);
    })
    .then(() => waitForResources(context.document))
    .then(() => emitPrint(context.document.defaultView!))
    .finally(() =>
      // The container can only be destroyed after the printing process has completed.
      removeNode(container)
    );
}

export default lightPrint;
