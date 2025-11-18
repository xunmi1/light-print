import {
  BrowserWindow,
  Element,
  HTMLCanvasElement,
  Window,
  Event,
  type Document,
  type CSSStyleDeclaration,
} from 'happy-dom';
import DOMTokenList from 'happy-dom/lib/dom/DOMTokenList';
import { illegalConstructor } from 'happy-dom/lib/PropertySymbol';
import { SELECTOR_NAME } from 'src/context';

type WindowConstructorOptions = ConstructorParameters<typeof Window>[0];
declare global {
  const window: Window;
  const document: Document;

  const Window: {
    prototype: Window;
    new (options?: WindowConstructorOptions): Window;
  };
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

// mock `drawImage`
const _getContext = HTMLCanvasElement.prototype.getContext;
function getContext(this: BrowserWindow, ...args: Parameters<HTMLCanvasElement['getContext']>) {
  const context = _getContext.call(this, ...args) ?? {};
  context.drawImage = () => {};
  return context;
}
HTMLCanvasElement.prototype.getContext = getContext;

// Due to `happy-dom`’s lack of pseudo-element support in getComputedStyle,
// we manually implemented it with the limitation of requiring `SELECTOR_NAME` style targeting.
// See https://github.com/capricorn86/happy-dom/issues/1773
const _getComputedStyle = BrowserWindow.prototype.getComputedStyle;
const emptyStyle = { getPropertyValue() {} };
function getComputedStyle(this: BrowserWindow, element: Element, pseudoElt?: string) {
  if (!pseudoElt) return _getComputedStyle.call(this, element) as CSSStyleDeclaration;
  // must be use `SELECTOR_NAME` to set style
  const id = element.getAttribute(SELECTOR_NAME);
  const currentWindow = element.ownerDocument.defaultView! as unknown as Window;
  return getStyleBySelector(currentWindow, `[${SELECTOR_NAME}="${id}"]${pseudoElt}`) ?? emptyStyle;
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

// `happy-dom` doesn't support `part` attribute
declare module 'happy-dom' {
  interface Element {
    part: DOMTokenList;
  }
}

const partKey = Symbol('part');
Object.defineProperty(Element.prototype, 'part', {
  get() {
    return (this[partKey] ??= new DOMTokenList(illegalConstructor, this, 'part'));
  },
});
