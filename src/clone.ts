import type { Context } from './context';
import { appendNode, createElementIterator, whichElement, getStyle, isMediaElement } from './utils';

const PSEUDO_ELECTORS = [
  '::before',
  '::after',
  '::marker',
  '::first-letter',
  '::first-line',
  '::placeholder',
  '::file-selector-button',
  '::details-content',
] as const;

const BLOCK_CONTAINERS = ['block', 'inline-block', 'list-item', 'flow-root', 'table-caption', 'table-cell'];

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
  // identical inline styles are omitted.
  return getStyleTextDiff(getStyle(target), getStyle(origin));
}

function getPseudoElementStyle<T extends Element>(target: T, origin: T, pseudoElt: (typeof PSEUDO_ELECTORS)[number]) {
  if (pseudoElt === '::placeholder') {
    if (!whichElement(origin, 'input') && !whichElement(origin, 'textarea')) return;
  } else if (pseudoElt === '::file-selector-button') {
    if (!(whichElement(origin, 'input') && origin.type === 'file')) return;
  } else if (pseudoElt === '::details-content') {
    if (!whichElement(origin, 'details')) return;
  } else if (pseudoElt === '::marker') {
    const display = getStyle(origin).display;
    if (display !== 'list-item') return;
  } else if (pseudoElt === '::first-letter' || pseudoElt === '::first-line') {
    const display = getStyle(origin).display;
    if (BLOCK_CONTAINERS.indexOf(display) < 0) return;
  }

  const originStyle = getStyle(origin, pseudoElt);
  // replaced elements need to be checked for `content`.
  if (pseudoElt === '::before' || pseudoElt === '::after') {
    const content = originStyle.content;
    if (!content || content === 'normal' || content === 'none') return;
  }
  const targetStyle = getStyle(target, pseudoElt);
  return getStyleTextDiff(targetStyle, originStyle);
}

/** clone element style */
function cloneElementStyle<T extends Element>(target: T, origin: T) {
  const nonInlineStyle = getElementNonInlineStyle(target, origin);
  if (!nonInlineStyle) return;
  const inlineStyle = target.getAttribute('style') ?? '';
  // setting inline styles immediately triggers a layout recalculation,
  // and subsequently retrieve the correct styles of the child elements.
  target.setAttribute('style', `${nonInlineStyle}${inlineStyle}`);
}

function clonePseudoElementStyle<T extends Element>(target: T, origin: T, context: Context) {
  let styleText = '';
  for (const pseudoElt of PSEUDO_ELECTORS) {
    const style = getPseudoElementStyle(target, origin, pseudoElt);
    if (!style) continue;
    const selector = context.getSelector(target);
    styleText += `${selector}${pseudoElt}{${style}}`;
  }
  context.appendStyle(styleText);
}

/** clone canvas */
function cloneCanvas<T extends HTMLCanvasElement>(target: T, origin: T) {
  if (origin.width === 0 || origin.height === 0) return;
  target.getContext('2d')!.drawImage(origin, 0, 0);
}

function cloneMedia<T extends HTMLMediaElement>(target: T, origin: T) {
  target.pause();
  target.currentTime = origin.currentTime;
}

function cloneElement(target: Element, origin: Element, context: Context) {
  cloneElementStyle(target, origin);
  // clone the associated pseudo-elements only when it's not `SVGElement`.
  // using `origin` because `target` is not in the current window, and `instanceof` cannot be used for judgment.
  if (!(origin instanceof SVGElement)) clonePseudoElementStyle(target, origin, context);
  if (whichElement(target, 'canvas')) cloneCanvas(target, origin as HTMLCanvasElement);
  if (isMediaElement(target)) cloneMedia(target, origin as HTMLMediaElement);
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
