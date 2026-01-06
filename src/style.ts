import { whichElement, isBlockContainer, getOwnerWindow } from './utils';

type Style = CSSStyleDeclaration;

export function getStyle(element: Element, pseudoElt?: string): Style {
  return getOwnerWindow(element).getComputedStyle(element, pseudoElt);
}

export function compareRule(selector: string, text: string) {
  return `${selector}{${text}}`;
}

function compare(cssText: string, property: Lowercase<string>, value: string) {
  return value ? cssText + property + ': ' + value + ';' : cssText;
}

function isBorderChanged(targetStyle: Style, originStyle: Style) {
  const border = originStyle.borderStyle;
  return border !== targetStyle.borderStyle && border !== 'none' && border !== 'hidden';
}

function isSizeChanged(targetStyle: Style, originStyle: Style) {
  // Changing `padding`, `margin` or `border` alters the element’s size.
  return (
    originStyle.boxSizing === 'border-box' &&
    (originStyle.padding !== targetStyle.padding || originStyle.borderWidth !== targetStyle.borderWidth)
  );
}

/** Whether the element has intrinsic aspect ratio */
function isIntrinsicAspectRatio(el: Element, style: Style) {
  if (whichElement(el, 'img') || whichElement(el, 'video')) return true;
  // SVG element’s aspect ratio is dictated by its `viewBox` by default.
  if (whichElement(el, 'svg') && el.getAttribute('viewBox')) return true;
  return !!style.aspectRatio && style.aspectRatio !== 'auto';
}

function diff(cssText: string, properties: ArrayLike<string>, targetStyle: Style, originStyle: Style) {
  for (let i = 0; i < properties.length; i++) {
    const property = properties[i] as Lowercase<string>;
    const value = originStyle.getPropertyValue(property);
    if (value && value !== targetStyle.getPropertyValue(property)) {
      cssText = compare(cssText, property, value);
    }
  }
  return cssText;
}

// When accessing `CSSStyleDeclaration` by index, the property name doesn’t include `counter`.
const CSS_PROPERTIES_ADDED = ['counter-reset', 'counter-set', 'counter-increment'] as const;

function getCSSText(targetStyle: Style, originStyle: Style, origin: Element) {
  let cssText = '';
  cssText = diff(cssText, originStyle, targetStyle, originStyle);
  cssText = diff(cssText, CSS_PROPERTIES_ADDED, targetStyle, originStyle);
  // If `border-style` is neither `none` nor `hidden`, the browser falls back the corresponding `border-width` to its initial value—medium
  // (3 px per spec, though engines variously resolve it to 2 px or 3 px).
  if (isBorderChanged(targetStyle, originStyle)) {
    cssText = compare(cssText, 'border-width', originStyle.borderWidth);
  }
  // For elements with an aspect ratio, always supply both width and height
  // to prevent incorrect auto-sizing based on that ratio.
  if (isSizeChanged(targetStyle, originStyle) || isIntrinsicAspectRatio(origin, originStyle)) {
    cssText = compare(cssText, 'width', originStyle.width);
    cssText = compare(cssText, 'height', originStyle.height);
  }
  // The `table` layout is always influenced by content;
  // whether `table-layout` is `auto` or `fixed`, we must give the table an explicit width to ensure accuracy.
  else if (originStyle.display === 'table') {
    cssText = compare(cssText, 'width', originStyle.width);
  }
  return cssText;
}

/** Clone element style; identical inline styles are omitted. */
export function getElementStyle<T extends Element>(target: T, origin: T, originStyle: Style) {
  return getCSSText(getStyle(target), originStyle, origin);
}

export const PSEUDO_ELECTORS = [
  '::before',
  '::after',
  '::marker',
  '::first-letter',
  '::first-line',
  '::placeholder',
  '::file-selector-button',
  '::details-content',
] as const;

export function getPseudoElementStyle<T extends Element>(
  target: T,
  origin: T,
  originStyle: Style,
  pseudoElt: (typeof PSEUDO_ELECTORS)[number]
) {
  if (pseudoElt === '::placeholder') {
    if (!((whichElement(origin, 'input') || whichElement(origin, 'textarea')) && origin.placeholder)) return;
  } else if (pseudoElt === '::file-selector-button') {
    if (!(whichElement(origin, 'input') && origin.type === 'file')) return;
  } else if (pseudoElt === '::details-content') {
    if (!whichElement(origin, 'details')) return;
  } else if (pseudoElt === '::marker') {
    if (originStyle.display !== 'list-item') return;
  } else if (pseudoElt === '::first-letter' || pseudoElt === '::first-line') {
    if (!isBlockContainer(originStyle)) return;
  }

  const pseudoOriginStyle = getStyle(origin, pseudoElt);
  // replaced elements need to be checked for `content`.
  if (pseudoElt === '::before' || pseudoElt === '::after') {
    const content = pseudoOriginStyle.content;
    if (!content || content === 'normal' || content === 'none') return;
  }
  return getCSSText(getStyle(target, pseudoElt), pseudoOriginStyle, origin);
}
