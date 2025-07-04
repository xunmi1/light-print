import { appendNode } from './utils';

export function createContext() {
  let styleNode: HTMLStyleElement;
  let printId = 1;

  function getSelector(node: Element) {
    let id = node.getAttribute('data-print-id');
    if (!id) {
      id = (printId++).toString();
      node.setAttribute('data-print-id', id);
    }
    return `[data-print-id="${id}"]`;
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
