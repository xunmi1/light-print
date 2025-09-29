import { appendNode } from './utils';

/**
 * Attribute name used to mark elements for printing.
 * @internal
 * Exporting this constant is solely for the convenience of testing.
 */
export const SELECTOR_NAME = 'data-print-id';

export function createContext() {
  let styleNode: HTMLStyleElement | undefined;
  let printId = 1;

  function markId(node: Element) {
    let id = node.getAttribute(SELECTOR_NAME);
    if (!id) {
      id = (printId++).toString();
      node.setAttribute(SELECTOR_NAME, id);
    }
    return id;
  }

  function getSelector(node: Element) {
    return `[${SELECTOR_NAME}="${markId(node)}"]`;
  }

  function appendStyle(text?: string) {
    if (!text) return;
    styleNode ??= context.document.createElement('style');
    styleNode.textContent += text;
  }

  function mountStyle() {
    if (!styleNode) return;
    appendNode(context.document.head, styleNode);
  }

  const context = {
    window: undefined as Window | undefined,
    get document() {
      return this.window!.document;
    },
    appendStyle,
    mountStyle,
    getSelector,
  };

  return context;
}

export type Context = ReturnType<typeof createContext>;
