import {
  BrowserWindow,
  HTMLCanvasElement,
  Window,
  Event,
  type Document,
  type Element,
  type CSSStyleDeclaration,
} from 'happy-dom';

declare global {
  const window: Window;
  const document: Document;
}

declare module 'happy-dom' {
  interface BrowserWindow {
    print(): void;
    getComputedStyle(element: Element, pseudoElt?: string): CSSStyleDeclaration;
  }
}

// `happy-dom` doesn't support `window.print()`,
// mock `window.print()` api
function print(this: BrowserWindow) {
  this.dispatchEvent(new Event('beforeprint'));
  this.dispatchEvent(new Event('afterprint'));
}
BrowserWindow.prototype.print = print;
window.print = print;

const _getContext = HTMLCanvasElement.prototype.getContext;
function getContext(this: BrowserWindow, ...args: Parameters<HTMLCanvasElement['getContext']>) {
  const context = _getContext.call(this, ...args) ?? {};
  // @ts-expect-error
  context.drawImage = () => {};
  return context;
}
// @ts-expect-error
HTMLCanvasElement.prototype.getContext = getContext;

// Due to happy-dom's lack of pseudo-element support in getComputedStyle,
// we manually implemented it with the limitation of requiring `data-print-id` style targeting.
// See https://github.com/capricorn86/happy-dom/issues/1773
const _getComputedStyle = BrowserWindow.prototype.getComputedStyle;
const emptyStyle = { getPropertyValue() {} };
function getComputedStyle(this: BrowserWindow, element: Element, pseudoElt?: string) {
  if (!pseudoElt) return _getComputedStyle.call(this, element) as CSSStyleDeclaration;
  // must be use `data-print-id` to set style
  const id = element.getAttribute('data-print-id');
  const currentWindow = element.ownerDocument.defaultView! as unknown as Window;
  return getStyleBySelector(currentWindow, `[data-print-id="${id}"]${pseudoElt}`) ?? emptyStyle;
}

function getStyleBySelector(currentWindow: BrowserWindow, selector: string) {
  const cssRules = Array.from(currentWindow.document.styleSheets).flatMap(styleSheet =>
    Array.from(styleSheet.cssRules)
  );

  // @ts-expect-error
  return cssRules.find(rule => rule?.selectorText === selector)?.style as CSSStyleDeclaration;
}

BrowserWindow.prototype.getComputedStyle = getComputedStyle;
window.getComputedStyle = getComputedStyle;
