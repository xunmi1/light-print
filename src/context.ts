import { appendNode } from './utils';

export function createContext(contentWindow: Window) {
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
    if (!styleNode) styleNode = contentWindow.document.createElement('style');
    styleNode.textContent += text;
  }

  function mountStyle() {
    if (!styleNode) return;
    appendNode(contentWindow.document.head, styleNode);
  }

  const context = {
    window: contentWindow,
    appendStyle,
    mountStyle,
    getSelector,
  };

  return context;
}

export type Context = ReturnType<typeof createContext>;
