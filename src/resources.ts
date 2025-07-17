import { whichElement, bindOnceEvent, withResolvers, type ElementNameMap, NOOP } from './utils';
import { waitFonts } from './fonts';

// `style` and `link` are not needed because of the use of `getComputedStyle`
// `source` element is not needed because it depends on other elements.
const RESOURCE_ELECTORS = ['img', 'audio', 'video', 'iframe', 'object', 'embed', 'image'] as const;

type ResourceElement = ElementNameMap[(typeof RESOURCE_ELECTORS)[number]];

function getResourceURL(node: ResourceElement) {
  if (whichElement(node, 'object')) return node.data;
  if (whichElement(node, 'iframe') || whichElement(node, 'embed')) return node.src;
  if (whichElement(node, 'image')) return node.href.baseVal;
  return node.currentSrc || node.src;
}

function checkLoaded(node: ResourceElement): Promise<void> | void {
  if (whichElement(node, 'img') && node.complete) return;
  const { promise, resolve, reject } = withResolvers<void>();
  bindOnceEvent(node, 'load', () => resolve());
  bindOnceEvent(node, 'error', () =>
    reject(new Error(`Failed to load resource (${node.localName}: ${getResourceURL(node)}).`))
  );
  return promise;
}

/** wait for resources loaded */
export function waitResources(doc: Document) {
  const selectors = RESOURCE_ELECTORS.join(',');
  const resourceNodes = Array.from(doc.querySelectorAll<ResourceElement>(selectors));
  const tasks = resourceNodes
    .filter(node => !!getResourceURL(node))
    .map(node => {
      //  load the resource as soon as possible.
      node.setAttribute('loading', 'eager');
      return checkLoaded(node);
    });
  tasks.push(waitFonts(doc));
  return Promise.all(tasks).then(NOOP);
}
