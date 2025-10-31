import { createContext, type Context } from './context';
import { getOwnerWindow, isElement, traverse } from './utils';

export type ShadowElement<E extends Element = Element, Mode extends ShadowRoot['mode'] = ShadowRoot['mode']> = E & {
  shadowRoot: Omit<ShadowRoot, 'mode'> & { mode: Mode };
};

function attachShadow(target: Element, origin: ShadowElement) {
  return target.attachShadow({ mode: 'open', delegatesFocus: origin.shadowRoot.delegatesFocus });
}

function cloneNode(ownerDocument: Document, shadowRoot: ShadowRoot) {
  const fragment = ownerDocument.createDocumentFragment();
  shadowRoot.childNodes.forEach(node => fragment.appendChild(ownerDocument.importNode(node, true)));
  return fragment;
}

function cloneSheets(target: ShadowElement, origin: ShadowElement) {
  const cssTexts = origin.shadowRoot.adoptedStyleSheets
    .flatMap(sheet => Array.from(sheet.cssRules).map(rule => rule.cssText))
    .join('\n');
  if (!cssTexts) return;
  const ownerWindow = getOwnerWindow(target);
  const sheet = new ownerWindow.CSSStyleSheet();
  sheet.replaceSync(cssTexts);
  target.shadowRoot.adoptedStyleSheets.push(sheet);
}

/**
 * Clone element with shadow root (mode: 'open').
 * Only modern browsers, not IE
 */
export function cloneOpenShadowRoot<T extends Element = Element>(
  target: T,
  origin: ShadowElement<T, 'open'>,
  visitor: (target: Element, origin: Element, context: Context) => boolean
) {
  // Should the shadowRoot be clonable, delegate its cloning to the earlier `importNode` for uniform handling.
  if (!origin.shadowRoot.clonable) {
    const ownerDocument = target.ownerDocument!;
    const context = createContext();
    context.bind(ownerDocument);
    // `happy-dom` BUG in unit tests; clones the `shadowRoot` when cloning a custom element
    if (import.meta.env.PROD || !target.shadowRoot) attachShadow(target, origin);
    else target.shadowRoot!.replaceChildren();
    const shadowRoot = target.shadowRoot!;
    shadowRoot.appendChild(cloneNode(ownerDocument, origin.shadowRoot));

    traverse(
      (innerTarget, innerOrigin) => {
        if (!isElement(innerOrigin)) return true;
        return visitor(innerTarget as Element, innerOrigin, context);
      },
      shadowRoot,
      origin.shadowRoot
    );

    context.flushTasks();
    context.mountStyle(shadowRoot);
  }
  cloneSheets(target as ShadowElement, origin);
}

export function isOpenShadowElement<T extends Element>(el: T): el is ShadowElement<T, 'open'> {
  return el.shadowRoot?.mode === 'open';
}
