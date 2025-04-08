import { bindOnceEvent, withResolvers } from './utils';

function isObjectElement(node: Element): node is HTMLObjectElement {
  return node.nodeName === 'OBJECT';
}

function isImageElement(node: Element): node is HTMLImageElement {
  return node.nodeName === 'IMG';
}

// `style` and `link` are not needed because of the use of `getComputedStyle`
const RESOURCE_ELECTORS = ['img', 'audio', 'video', 'iframe', 'object', 'embed'];

type ResourceElement =
  | HTMLImageElement
  | HTMLAudioElement
  | HTMLVideoElement
  | HTMLIFrameElement
  | HTMLObjectElement
  | HTMLEmbedElement;

function getResourceURL(node: ResourceElement) {
  if (isObjectElement(node)) return node.data;
  // @ts-expect-error
  return node.currentSrc || node.src;
}

function checkLoaded(node: ResourceElement) {
  const { promise, resolve, reject } = withResolvers<void>();
  if (isImageElement(node) && node.complete) return resolve();
  bindOnceEvent(node, 'load', () => resolve());
  bindOnceEvent(node, 'error', () =>
    reject(new Error(`Failed to load resource (${node.nodeName.toLowerCase()}: ${getResourceURL(node)}).`))
  );
  return promise;
}

/** wait for resources loaded */
export function waitResources(currentWindow: Window) {
  // ignore non-resource nodes
  const resourceNodes = Array.from(
    currentWindow.document.querySelectorAll<ResourceElement>(RESOURCE_ELECTORS.join(','))
  ).filter(node => !!getResourceURL(node));
  return Promise.all(
    resourceNodes.map(node => {
      //  load the resource as soon as possible.
      node.setAttribute('loading', 'eager');
      return checkLoaded(node);
    })
  );
}
