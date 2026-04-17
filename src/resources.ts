import { whichElement, bindOnceEvent, withResolvers, type ElementNameMap, NOOP, isMediaElement } from './utils';
import { waitForFonts } from './fonts';

// `source` element is not needed because it depends on other elements.
const RESOURCE_ELECTORS = ['img', 'audio', 'video', 'iframe', 'object', 'embed', 'image'] as const;

type ResourceElement = ElementNameMap[(typeof RESOURCE_ELECTORS)[number]];

function getResourceElements(doc: Document) {
  const selectors = RESOURCE_ELECTORS.join(',');
  return Array.from(doc.querySelectorAll<ResourceElement>(selectors)).filter(el => !!getResourceURL(el));
}

function getResourceURL(el: ResourceElement) {
  if (whichElement(el, 'object')) return el.data;
  if (whichElement(el, 'iframe') || whichElement(el, 'embed')) return el.src;
  if (whichElement(el, 'image')) return el.href.baseVal;
  return el.currentSrc || el.src;
}

function waitForElement(el: ResourceElement): Promise<void> | void {
  if (whichElement(el, 'img') && el.complete) return;
  const { promise, resolve, reject } = withResolvers<void>();
  if (isMediaElement(el)) {
    // `2` is `HTMLMediaElement.HAVE_CURRENT_DATA`
    if (el.readyState >= 2) resolve();
    else bindOnceEvent(el, 'canplay', () => resolve());
  } else {
    bindOnceEvent(el, 'load', () => resolve());
  }
  bindOnceEvent(el, 'error', () =>
    reject(new Error(`Failed to load resource (${el.localName}: ${getResourceURL(el)}).`))
  );
  return promise;
}

function forceEagerLoad(el: Element) {
  // `HTMLMediaElement.loading` is supported in Chrome v148.
  // @ts-expect-error
  if (whichElement(el, 'img') || whichElement(el, 'iframe') || isMediaElement(el)) el.loading = 'eager';
}

/** Wait for resources to finish loading. */
export function waitForResources(doc: Document) {
  const elements = getResourceElements(doc);
  elements.forEach(el => forceEagerLoad(el));
  const tasks = elements.map(el => waitForElement(el));
  tasks.push(waitForFonts(doc));
  return Promise.all(tasks).then(NOOP);
}
