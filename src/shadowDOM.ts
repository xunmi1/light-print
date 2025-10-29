import { getOwnerWindow, isElement } from './utils';

type ShadowElement<E extends Element = Element, Mode extends ShadowRoot['mode'] = ShadowRoot['mode']> = E & {
  shadowRoot: Omit<ShadowRoot, 'mode'> & { mode: Mode };
};

function traverse(visitor: (origin: Node) => Node, parent: Node, childNodes: NodeListOf<Node>) {
  childNodes.forEach(node => {
    const newNode = visitor(node);
    traverse(visitor, newNode, node.childNodes);
    parent.appendChild(newNode);
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
 * Clone element with shadow root (mode: 'open').
 * Only modern browsers, not IE
 */
export function cloneOpenShadowRoot<T extends Element = Element>(
  target: T,
  origin: ShadowElement<T, 'open'>,
  visitor: (target: Element, origin: Element) => void
) {
  // Should the shadowRoot be clonable, delegate its cloning to the earlier `importNode` for uniform handling.
  if (!origin.shadowRoot.clonable) {
    const shadowRoot = target.shadowRoot ?? attachShadow(target, origin);
    const ownerDocument = target.ownerDocument!;
    // Clone all nodes rather than reconstructing styles with `getComputedStyle`.
    traverse(
      node => {
        const newNode = ownerDocument.importNode(node, false);
        if (isElement(node)) {
          const _newNode = newNode as Element;
          if (isOpenShadowElement(node)) cloneOpenShadowRoot(_newNode, node, visitor);
          visitor(_newNode, node);
        }
        return newNode;
      },
      shadowRoot,
      origin.shadowRoot.childNodes
    );
  }
  cloneSheets(target as ShadowElement, origin);
}

export function isOpenShadowElement<T extends Element>(el: T): el is ShadowElement<T, 'open'> {
  return el.shadowRoot?.mode === 'open';
}
