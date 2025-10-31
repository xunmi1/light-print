import type { Context } from './context';
import {
  appendNode,
  whichElement,
  isMediaElement,
  isRenderingElement,
  isHidden,
  isExternalStyleElement,
  traverse,
  type ElementWithStyle,
} from './utils';
import { getStyle, getElementStyle, getPseudoElementStyle, PSEUDO_ELECTORS } from './style';
import { isOpenShadowElement, cloneOpenShadowRoot, type ShadowElement } from './shadowDOM';

/** clone element style */
function cloneElementStyle<T extends ElementWithStyle>(
  target: T,
  origin: T,
  originStyle: CSSStyleDeclaration,
  context: Context
) {
  // identical inline styles are omitted.
  const injectionStyle = getElementStyle(target, origin, originStyle);
  if (!injectionStyle) return;
  const cssText = `${origin.style.cssText}${injectionStyle}`;
  // Inline style trigger an immediate layout reflow,
  // after which fewer and correct rules have to be resolved for the children; in practice this is measurably faster.
  // The downside is their sky-high specificity: overriding them with mediaPrintStyle is painful,
  // We therefore strip the inline declarations once cloning finishes and hand the job over to a clean style sheet.
  target.setAttribute('style', cssText);
  const styleRule = `${context.getSelector(target)}{${cssText}}`;
  context.addTask(() => {
    // Inline style carry higher specificity; strip them to let the `injectionStyle` (external style) prevail.
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
  if (origin instanceof SVGElement) return;
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

function cloneShadowElement(innerTarget: Element, innerOrigin: ShadowElement<Element, 'open'>) {
  cloneOpenShadowRoot(innerTarget, innerOrigin, (target, origin, context) => {
    // If an element has the `part` attribute, external `::part()` rules can reach into the shadow tree,
    // so we must re-clone its styles. (https://developer.mozilla.org/docs/Web/CSS/::part)
    // Conversely, styles inside the shadow tree are governed by its own <style>, so cloning them is unnecessary.
    const shouldCloneStyle = !!origin.part?.value;
    return cloneElement(target, origin, context, shouldCloneStyle);
  });
}

function cloneElement(target: Element, origin: Element, context: Context, shouldCloneStyle = true) {
  if (!isRenderingElement(target)) return true;
  if (shouldCloneStyle) {
    const originStyle = getStyle(origin);
    // Remove hidden element.
    if (isHidden(originStyle) && !isExternalStyleElement(origin)) return false;
    cloneElementStyle(target as ElementWithStyle, origin as ElementWithStyle, originStyle, context);
    clonePseudoElementStyle(target, origin, originStyle, context);
  }
  if (isOpenShadowElement(origin)) cloneShadowElement(target, origin);
  cloneElementProperties(target, origin);
  return true;
}

export function cloneDocument(context: Context, hostElement: Element) {
  const doc = context.document;
  // clone the `hostElement` structure to `body`.
  doc.importNode(hostElement, true);
  appendNode(doc.body, doc.importNode(hostElement, true));
  traverse((target, origin) => cloneElement(target, origin, context), doc.body.firstElementChild!, hostElement);
  context.flushTasks();
}
