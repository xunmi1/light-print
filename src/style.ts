import {
  whichElement,
  isBlockContainer,
  type ElementWithStyle,
  hasIntrinsicAspectRatio,
  getOwnerWindow,
} from './utils';

export function getStyle(element: Element, pseudoElt?: string) {
  return getOwnerWindow(element).getComputedStyle(element, pseudoElt);
}

function toCSSText(styles: Record<string, string>) {
  let cssText = '';
  const properties = Object.keys(styles);
  for (let i = 0; i < properties.length; i++) {
    const property = properties[i];
    cssText += `${property}:${styles[property]};`;
  }
  return cssText;
}

// When accessing `CSSStyleDeclaration` by index, the property name doesn’t include `counter`.
const CSS_PROPERTIES_ADDED = ['counter-reset', 'counter-set', 'counter-increment'] as const;
const BORDER_PATTERN = /^border/;
// Changing `padding`, `margin` or `border` alters the element’s size.
const SIZE_PATTERN = /^(padding|margin|border)/;

function getCSSText(targetStyle: CSSStyleDeclaration, originStyle: CSSStyleDeclaration, origin: Element) {
  const styles: Record<string, string> = {};
  // If `border-style` is neither `none` nor `hidden`, the browser falls back the corresponding border-width to its initial value—medium
  // (3 px per spec, though engines variously resolve it to 2 px or 3 px).
  let isBorderChanged = false;
  // For elements with an aspect ratio, always supply both width and height
  // to prevent incorrect auto-sizing based on that ratio.
  let isSizeChanged = hasIntrinsicAspectRatio(origin as ElementWithStyle);

  for (let index = 0; index < originStyle.length; index++) {
    const property = originStyle[index];
    const value = originStyle.getPropertyValue(property);
    if (value && value !== targetStyle.getPropertyValue(property)) {
      styles[property] = value;
      isBorderChanged ||= BORDER_PATTERN.test(property);
      isSizeChanged ||= isBorderChanged || SIZE_PATTERN.test(property);
    }
  }

  for (let index = 0; index < CSS_PROPERTIES_ADDED.length; index++) {
    const property = CSS_PROPERTIES_ADDED[index];
    const value = originStyle.getPropertyValue(property);
    if (value && value !== targetStyle.getPropertyValue(property)) {
      styles[property] = value;
    }
  }

  if (isBorderChanged) {
    styles['border-width'] = originStyle.borderWidth;
  }
  if (isSizeChanged) {
    styles.width = originStyle.width;
    styles.height = originStyle.height;
  } else if (originStyle.display === 'table') {
    // The `table` layout is always influenced by content;
    // whether `table-layout` is `auto` or `fixed`, we must give the table an explicit width to ensure accuracy.
    styles.width = originStyle.width;
  }
  return toCSSText(styles);
}

/** Clone element style; identical inline styles are omitted. */
export function getElementStyle<T extends ElementWithStyle>(target: T, origin: T, originStyle: CSSStyleDeclaration) {
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
  originStyle: CSSStyleDeclaration,
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
