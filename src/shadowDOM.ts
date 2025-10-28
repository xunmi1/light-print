import { getOwnerWindow, isElement } from './utils';

type ShadowElement<T extends Element = Element> = T & { shadowRoot: ShadowRoot };

function traverse(visitor: (origin: Node) => Node, current: Node, childNodes: NodeListOf<Node>) {
  childNodes.forEach(node => {
    const newNode = visitor(node);
    traverse(visitor, newNode, node.childNodes);
    current.appendChild(newNode);
  });
}

function attachShadow(target: Element, origin: ShadowElement) {
  return target.attachShadow({ mode: 'open', delegatesFocus: origin.shadowRoot.delegatesFocus });
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
 * Clone element with shadow root.
 * Only modern browsers, not IE
 */
export function cloneShadowRoot<T extends Element = Element>(
  target: T,
  origin: ShadowElement<T>,
  visitor: (target: Element, origin: Element) => void
) {
  // Should the shadowRoot be clonable, delegate its cloning to the earlier `importNode` for uniform handling.
  if (!origin.shadowRoot.clonable) {
    const shadowRoot = target.shadowRoot ?? attachShadow(target, origin);
    const ownerDocument = target.ownerDocument!;
    traverse(
      node => {
        const newNode = ownerDocument.importNode(node, false);
        if (isElement(node)) visitor(newNode as Element, node);
        return newNode;
      },
      shadowRoot,
      origin.shadowRoot.childNodes
    );
  }
  cloneSheets(target as ShadowElement, origin);
}

export function isOpenShadowElement<T extends Element>(el: T): el is ShadowElement<T> {
  return el.shadowRoot?.mode === 'open';
}
