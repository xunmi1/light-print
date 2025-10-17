import type { Context } from './context';
import {
  appendNode,
  createElementWalker,
  type ElementWalker,
  whichElement,
  getStyle,
  isMediaElement,
  removeNode,
  isRenderingElement,
  isHidden,
  isInsideBlock,
} from './utils';

function getStyleTextDiff(targetStyle: CSSStyleDeclaration, originStyle: CSSStyleDeclaration) {
  let styleText = '';
  for (let index = 0; index < originStyle.length; index++) {
    const property = originStyle[index];
    const value = originStyle.getPropertyValue(property);
    if (value && value !== targetStyle.getPropertyValue(property)) styleText += `${property}:${value};`;
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
    if (!whichElement(origin, 'input') && !whichElement(origin, 'textarea')) return;
  } else if (pseudoElt === '::file-selector-button') {
    if (!(whichElement(origin, 'input') && origin.type === 'file')) return;
  } else if (pseudoElt === '::details-content') {
    if (!whichElement(origin, 'details')) return;
  } else if (pseudoElt === '::marker') {
    if (originStyle.display !== 'list-item') return;
  } else if (pseudoElt === '::first-letter' || pseudoElt === '::first-line') {
    if (!isInsideBlock(originStyle)) return;
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
function cloneElementStyle<T extends Element>(target: T, originStyle: CSSStyleDeclaration, context: Context) {
  // identical inline styles are omitted.
  const nonInlineStyle = getStyleTextDiff(getStyle(target), originStyle);
  if (!nonInlineStyle) return;
  const inlineStyle = target.getAttribute('style') ?? '';
  // Inline style trigger an immediate layout reflow,
  // after which fewer and correct rules have to be resolved for the children; in practice this is measurably faster.
  // The downside is their sky-high specificity: overriding them with mediaPrintStyle is painful,
  // We therefore strip the inline declarations once cloning finishes and hand the job over to a clean style sheet.
  target.setAttribute('style', `${nonInlineStyle}${inlineStyle}`);
  const styleText = `${context.getSelector(target)}{${nonInlineStyle}}`;
  context.addTask(() => {
    target.setAttribute('style', inlineStyle);
    context.appendStyle(styleText);
  });
}

function clonePseudoElementStyle<T extends Element>(
  target: T,
  origin: T,
  originStyle: CSSStyleDeclaration,
  context: Context
) {
  let styleText = '';
  let selector: string | undefined;
  for (const pseudoElt of PSEUDO_ELECTORS) {
    const style = getPseudoElementStyle(target, origin, originStyle, pseudoElt);
    if (!style) continue;
    selector ??= context.getSelector(target);
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
  // Sync scroll state
  const scrollTop = origin.scrollTop;
  const scrollLeft = origin.scrollLeft;
  if (scrollTop || scrollLeft) {
    target.scrollTop = scrollTop;
    target.scrollLeft = scrollLeft;
  }
}

function cloneElement(target: Element, origin: Element, context: Context) {
  if (!isRenderingElement(target)) return true;
  const originStyle = getStyle(origin);
  // Ignore hidden element.
  if (isHidden(originStyle)) return false;

  cloneElementStyle(target, originStyle, context);
  if (!(origin instanceof SVGElement)) clonePseudoElementStyle(target, origin, originStyle, context);

  cloneElementProperties(target, origin);
  if (whichElement(target, 'canvas')) cloneCanvas(target, origin as HTMLCanvasElement);
  if (isMediaElement(target)) cloneMedia(target, origin as HTMLMediaElement);
  return true;
}

function syncWalk(
  whetherNext: (target: Element, origin: Element) => boolean,
  targetWalker: ElementWalker,
  originWalker: ElementWalker
) {
  while (true) {
    const isNext = whetherNext(targetWalker.currentNode, originWalker.currentNode);
    if (isNext) {
      if (!(targetWalker.nextNode() && originWalker.nextNode())) break;
    } else {
      const skippedNode = targetWalker.currentNode;
      let hasParent = true;
      while (true) {
        const hasSibling = targetWalker.nextSibling() && originWalker.nextSibling();
        if (hasSibling) break;
        // If the current element has no next sibling, move to the next sibling of its parent.
        hasParent = !!(targetWalker.parentNode() && originWalker.parentNode());
        if (!hasParent) break;
      }
      // Remove the skipped element and its subtree, to prevent any resources from being loaded.
      removeNode(skippedNode);
      if (!hasParent) break;
    }
  }
}

export function cloneDocument(context: Context, hostElement: Element) {
  const doc = context.document;
  // clone the `hostElement` structure to `body`, contains inline styles.
  appendNode(doc.body, doc.importNode(hostElement, true));
  const originWalker = createElementWalker(hostElement);
  const targetWalker = createElementWalker(doc.body.firstElementChild!);
  syncWalk((target, origin) => cloneElement(target, origin, context), targetWalker, originWalker);
  context.flushTasks();
}
