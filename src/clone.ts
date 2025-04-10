import { getPrintIdSelector } from './printId';
import { getSharedStyleNode } from './utils';

function toStyleText(style?: CSSStyleDeclaration) {
  if (!style?.length) return '';
  let styleText = '';
  for (let index = 0; index < style.length; index++) {
    const value = style.getPropertyValue(style[index]);
    if (value) styleText += `${style[index]}:${value};`;
  }

  return styleText;
}

/** clone element style */
function cloneElementStyle<T extends Element>(target: T, origin: T) {
  target.setAttribute('style', toStyleText(window.getComputedStyle(origin)));
}

const PSEUDO_ELECTORS = [
  '::before',
  '::after',
  '::marker',
  '::first-letter',
  '::first-line',
  '::placeholder',
  '::file-selector-button',
  '::details-content',
];

const PSEUDO_ELECTORS_REPLACED = ['::before', '::after', '::marker'];

function clonePseudoElementStyle<T extends Element>(target: T, origin: T) {
  const selector = getPrintIdSelector(target);
  if (!selector) return;
  let styleText = '';
  for (const pseudoElt of PSEUDO_ELECTORS) {
    const style = toStyleText(getPseudoElementStyle(origin, pseudoElt));
    if (style) styleText += `${selector}${pseudoElt}{${style}}`;
  }
  if (styleText) {
    const styleNode = getSharedStyleNode(target.ownerDocument);
    styleNode.textContent += styleText;
  }
}

function getPseudoElementStyle(origin: Element, pseudoElt: string) {
  if (pseudoElt === '::placeholder') {
    if (origin.nodeName !== 'INPUT' && origin.nodeName !== 'TEXTAREA') return;
  } else if (pseudoElt === '::file-selector-button') {
    if (!(origin.nodeName === 'INPUT' && (origin as HTMLInputElement).type === 'file')) return;
  } else if (pseudoElt === '::details-content') {
    if (origin.nodeName !== 'DETAILS') return;
  }
  const style = window.getComputedStyle(origin, pseudoElt);
  // Replaced elements need to be checked for `content`.
  if (PSEUDO_ELECTORS_REPLACED.includes(pseudoElt)) {
    const content = style.content;
    if (!content || content === 'normal' || content === 'none') return;
  }
  return style;
}

/** clone canvas */
function cloneCanvas<T extends HTMLCanvasElement>(target: T, origin: T) {
  target.getContext('2d')?.drawImage(origin, 0, 0);
}

export function cloneNode(target: Element, origin: Element) {
  cloneElementStyle(target, origin);
  clonePseudoElementStyle(target, origin);
  if (target.nodeName === 'CANVAS') cloneCanvas(target as HTMLCanvasElement, origin as HTMLCanvasElement);
}
