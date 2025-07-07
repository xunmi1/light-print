import type { Context } from './context';
import { appendNode, createElementIterator, whichElement } from './utils';

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

function getStyleTextDiff(targetStyle: CSSStyleDeclaration, originStyle: CSSStyleDeclaration) {
  let styleText = '';
  for (let index = 0; index < originStyle.length; index++) {
    const property = originStyle[index];
    const value = originStyle.getPropertyValue(property);
    if (value && value !== targetStyle.getPropertyValue(property)) styleText += `${property}:${value};`;
  }

  return styleText;
}

function getElementNonInlineStyle<T extends Element>(target: T, origin: T) {
  return getStyleTextDiff(window.getComputedStyle(target), window.getComputedStyle(origin));
}

function getPseudoElementStyle<T extends Element>(target: T, origin: T, pseudoElt: string) {
  if (pseudoElt === '::placeholder') {
    if (!whichElement(origin, 'input') && !whichElement(origin, 'textarea')) return;
  } else if (pseudoElt === '::file-selector-button') {
    if (!(whichElement(origin, 'input') && origin.type === 'file')) return;
  } else if (pseudoElt === '::details-content') {
    if (!whichElement(origin, 'details')) return;
  }
  const originStyle = window.getComputedStyle(origin, pseudoElt);
  // replaced elements need to be checked for `content`.
  if (PSEUDO_ELECTORS_REPLACED.includes(pseudoElt)) {
    const content = originStyle.content;
    if (!content || content === 'normal' || content === 'none') return;
  }
  const targetStyle = window.getComputedStyle(target, pseudoElt);

  return getStyleTextDiff(targetStyle, originStyle);
}

/** clone element style */
function cloneElementStyle<T extends Element>(target: T, origin: T, context: Context) {
  // inline styles have been cloned,
  // thus only styles defined via non-inline styles require cloning.
  const style = getElementNonInlineStyle(target, origin);
  if (!style) return;
  const selector = context.getSelector(target);
  context.appendStyle(`${selector}{${style}}`);
}

function clonePseudoElementStyle<T extends Element>(target: T, origin: T, context: Context) {
  const selector = context.getSelector(target);
  let styleText = '';
  for (const pseudoElt of PSEUDO_ELECTORS) {
    const style = getPseudoElementStyle(target, origin, pseudoElt);
    if (style) styleText += `${selector}${pseudoElt}{${style}}`;
  }
  context.appendStyle(styleText);
}

/** clone canvas */
function cloneCanvas<T extends HTMLCanvasElement>(target: T, origin: T) {
  target.getContext('2d')!.drawImage(origin, 0, 0);
}

function cloneElement(target: Element, origin: Element, context: Context) {
  cloneElementStyle(target, origin, context);
  // clone the associated pseudo-elements only When it's not `SVGElement`.
  // using `origin` because `target` is not in the current window, and `instanceof` cannot be used for judgment.
  if (!(origin instanceof SVGElement)) clonePseudoElementStyle(target, origin, context);
  if (whichElement(target, 'canvas')) cloneCanvas(target, origin as HTMLCanvasElement);
}

export function cloneDocument(context: Context, hostElement: Node) {
  const doc = context.document;
  // clone the `hostElement` structure to `body`, contains inline styles.
  appendNode(doc.body, doc.importNode(hostElement, true));

  const originIterator = createElementIterator(hostElement);
  // start from `body` node
  const targetIterator = createElementIterator(doc.body);
  // skip `body` node
  targetIterator.nextNode();
  while (true) {
    const targetElement = targetIterator.nextNode();
    const originElement = originIterator.nextNode();
    if (!targetElement || !originElement) break;
    cloneElement(targetElement, originElement, context);
  }
}
