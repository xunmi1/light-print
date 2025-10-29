import type { Context } from './context';
import {
  appendNode,
  whichElement,
  getStyle,
  isMediaElement,
  removeNode,
  isRenderingElement,
  isHidden,
  isBlockContainer,
  toArray,
  type ElementWithStyle,
  hasIntrinsicAspectRatio,
} from './utils';
import { isOpenShadowElement, cloneOpenShadowRoot } from './shadowDOM';

function getStyleTextDiff(targetStyle: CSSStyleDeclaration, originStyle: CSSStyleDeclaration) {
  let styleText = '';
  for (let index = 0; index < originStyle.length; index++) {
    const property = originStyle[index];
    const value = originStyle.getPropertyValue(property);
    if (value && value !== targetStyle.getPropertyValue(property)) styleText += `${property}:${value};`;
  }
  return styleText;
}

function fixEdgeCaseStyle(styleText: string, origin: ElementWithStyle, originStyle: CSSStyleDeclaration) {
  // For elements with an aspect ratio, always supply both width and height
  // to prevent incorrect auto-sizing based on that ratio.
  if (hasIntrinsicAspectRatio(origin)) {
    styleText += `width:${originStyle.width};height:${originStyle.height};`;
  }
  // The `table` layout is always influenced by content;
  // whether `table-layout` is `auto` or `fixed`, we must give the table an explicit width to ensure accuracy.
  if (originStyle.display === 'table') {
    styleText += `width:${originStyle.width};`;
  }
  return styleText;
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
] as const;

function getPseudoElementStyle<T extends Element>(
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

/** clone element style */
function cloneElementStyle<T extends ElementWithStyle>(
  target: T,
  origin: T,
  originStyle: CSSStyleDeclaration,
  context: Context
) {
  // identical inline styles are omitted.
  let injectionStyle = getStyleTextDiff(getStyle(target), originStyle);
  injectionStyle = fixEdgeCaseStyle(injectionStyle, origin, originStyle);
  if (!injectionStyle) return;
  const cssText = `${origin.style.cssText}${injectionStyle}`;
  // Inline style trigger an immediate layout reflow,
  // after which fewer and correct rules have to be resolved for the children; in practice this is measurably faster.
  // The downside is their sky-high specificity: overriding them with mediaPrintStyle is painful,
  // We therefore strip the inline declarations once cloning finishes and hand the job over to a clean style sheet.
  target.setAttribute('style', cssText);
  const styleRule = `${context.getSelector(target)}{${cssText}}`;
  context.addTask(() => {
    target.removeAttribute('style');
    context.appendStyle(styleRule);
  });
}

function clonePseudoElementStyle<T extends Element>(
  target: T,
  origin: T,
  originStyle: CSSStyleDeclaration,
  context: Context
) {
  let styleRules = '';
  let selector: string | undefined;
  for (const pseudoElt of PSEUDO_ELECTORS) {
    const style = getPseudoElementStyle(target, origin, originStyle, pseudoElt);
    if (!style) continue;
    selector ??= context.getSelector(target);
    styleRules += `${selector}${pseudoElt}{${style}}`;
  }
  context.appendStyle(styleRules);
}

/** clone canvas */
function cloneCanvas<T extends HTMLCanvasElement>(target: T, origin: T) {
  if (origin.width === 0 || origin.height === 0) return;
  target.getContext('2d')!.drawImage(origin, 0, 0);
}

function cloneMedia<T extends HTMLMediaElement>(target: T, origin: T) {
  if (!origin.currentSrc) return;
  // In the new document, currentSrc isn’t populated right away and is read-only,
  // so we explicitly assign src here.
  target.src = origin.currentSrc;
  // The precision of `video.currentTime` might get rounded depending on browser settings.
  // @see https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/currentTime#reduced_time_precision
  target.currentTime = origin.currentTime;
  // Printing doesn’t need to play anything.
  target.autoplay = false;
}

function setScrollState(target: Element, origin: Element) {
  const scrollTop = origin.scrollTop;
  const scrollLeft = origin.scrollLeft;
  if (scrollTop || scrollLeft) {
    target.scrollTop = scrollTop;
    target.scrollLeft = scrollLeft;
  }
}

// clone element properties
function cloneElementProperties(target: Element, origin: Element) {
  // The only thing that doesn’t get copied is the `<select> / <option>` ’s current state.
  // To be safe, we also set the state of some other elements.
  if (whichElement(target, 'select') || whichElement(target, 'textarea')) {
    target.value = (origin as HTMLTextAreaElement | HTMLSelectElement).value;
  } else if (whichElement(target, 'option')) {
    target.selected = (origin as HTMLOptionElement).selected;
  } else if (whichElement(target, 'input')) {
    const _origin = origin as HTMLInputElement;
    target.value = _origin.value;
    target.checked = _origin.checked;
    target.indeterminate = _origin.indeterminate;
  }

  if (whichElement(target, 'canvas')) cloneCanvas(target, origin as HTMLCanvasElement);
  if (isMediaElement(target)) cloneMedia(target, origin as HTMLMediaElement);

  setScrollState(target, origin);
}

function cloneElement(target: Element, origin: Element, context: Context) {
  if (!isRenderingElement(target)) return true;
  const originStyle = getStyle(origin);
  // Remove hidden element.
  if (isHidden(originStyle)) return false;

  cloneElementStyle(target as ElementWithStyle, origin as ElementWithStyle, originStyle, context);
  if (!(origin instanceof SVGElement)) clonePseudoElementStyle(target, origin, originStyle, context);

  if (isOpenShadowElement(origin)) cloneOpenShadowRoot(target, origin, cloneElementProperties);
  cloneElementProperties(target, origin);
  return true;
}

function traverse(visitor: (target: Element, origin: Element) => boolean, target: Element, origin: Element) {
  if (!visitor(target, origin)) return removeNode(target);
  const children = toArray(target.children);
  for (let i = 0; i < children.length; i++) {
    traverse(visitor, children[i], origin.children[i]);
  }
}

export function cloneDocument(context: Context, hostElement: Element) {
  const doc = context.document;
  // clone the `hostElement` structure to `body`.
  doc.importNode(hostElement, true);
  appendNode(doc.body, doc.importNode(hostElement, true));
  traverse((target, origin) => cloneElement(target, origin, context), doc.body.firstElementChild!, hostElement);
  context.flushTasks();
}
