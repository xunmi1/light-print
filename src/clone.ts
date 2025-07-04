import type { Context } from './context';
import { appendNode, createElementIterator, whichElement } from './utils';

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

function clonePseudoElementStyle<T extends Element>(target: T, origin: T, context: Context) {
  const selector = context.getSelector(target);
  let styleText = '';
  for (const pseudoElt of PSEUDO_ELECTORS) {
    const style = toStyleText(getPseudoElementStyle(origin, pseudoElt));
    if (style) styleText += `${selector}${pseudoElt}{${style}}`;
  }
  context.appendStyle(styleText);
}

function getPseudoElementStyle(origin: Element, pseudoElt: string) {
  if (pseudoElt === '::placeholder') {
    if (!whichElement(origin, 'input') && !whichElement(origin, 'textarea')) return;
  } else if (pseudoElt === '::file-selector-button') {
    if (!(whichElement(origin, 'input') && origin.type === 'file')) return;
  } else if (pseudoElt === '::details-content') {
    if (!whichElement(origin, 'details')) return;
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
  target.getContext('2d')!.drawImage(origin, 0, 0);
}

function cloneElement(target: Element, origin: Element, context: Context) {
  cloneElementStyle(target, origin);
  // clone the associated pseudo-elements only When it's not `SVGElement`.
  // using `origin` because `target` is not in the current window, and `instanceof` cannot be used for judgment.
  if (!(origin instanceof SVGElement)) clonePseudoElementStyle(target, origin, context);
  if (whichElement(target, 'canvas')) cloneCanvas(target, origin as HTMLCanvasElement);
}

export function cloneDocument(context: Context, hostElement: Node) {
  const doc = context.document;
  // clone the `hostElement` structure.
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
