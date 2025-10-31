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

function getStyleTextDiff(targetStyle: CSSStyleDeclaration, originStyle: CSSStyleDeclaration) {
  let styleText = '';
  for (let index = 0; index < originStyle.length; index++) {
    const property = originStyle[index];
    const value = originStyle.getPropertyValue(property);
    if (value && value !== targetStyle.getPropertyValue(property)) styleText += `${property}:${value};`;
  }
  return styleText;
}

// Changing `padding` or `border-width` alters the element’s size.
const SIZE_CHANGED_PATTERN = /padding-(top|right|bottom|left):|border-(top|right|bottom|left)-width:/;
function isSizeChanged(styleText: string) {
  return SIZE_CHANGED_PATTERN.test(styleText);
}

function fixEdgeCaseStyle(styleText: string, origin: ElementWithStyle, originStyle: CSSStyleDeclaration) {
  // For elements with an aspect ratio, always supply both width and height
  // to prevent incorrect auto-sizing based on that ratio.
  if (hasIntrinsicAspectRatio(origin) || isSizeChanged(styleText)) {
    styleText += `width:${originStyle.width};height:${originStyle.height};`;
  }
  // The `table` layout is always influenced by content;
  // whether `table-layout` is `auto` or `fixed`, we must give the table an explicit width to ensure accuracy.
  if (originStyle.display === 'table') {
    styleText += `width:${originStyle.width};`;
  }
  return styleText;
}

/** Clone element style; identical inline styles are omitted. */
export function getElementStyle<T extends ElementWithStyle>(target: T, origin: T, originStyle: CSSStyleDeclaration) {
  return fixEdgeCaseStyle(getStyleTextDiff(getStyle(target), originStyle), origin, originStyle);
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
  return getStyleTextDiff(getStyle(target, pseudoElt), pseudoOriginStyle);
}
