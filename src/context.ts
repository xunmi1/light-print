import { appendNode } from './utils';

/**
 * Attribute name used to mark elements for printing.
 * @internal
 * Exporting this constant is solely for the convenience of testing.
 */
export const SELECTOR_NAME = 'data-print-id';

export function createContext<T extends Document>() {
  let styleNode: HTMLStyleElement | undefined;
  let isMountedStyle = false;
  let printId = 1;
  let doc: T;

  function bind(ownerDocument: T) {
    doc = ownerDocument;
  }

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
    styleNode ??= doc.createElement('style');
    styleNode.textContent += text;
  }

  function mountStyle(parent?: Node) {
    if (isMountedStyle || !styleNode) return;
    appendNode(parent || doc.head, styleNode);
    isMountedStyle = true;
  }

  const tasks: (() => void)[] = [];
  function addTask(task: () => void) {
    tasks.push(task);
  }

  function flushTasks() {
    tasks.forEach(task => task());
    tasks.length = 0;
  }

  return {
    get document() {
      return doc;
    },
    bind,
    appendStyle,
    mountStyle,
    getSelector,

    addTask,
    flushTasks,
  };
}

export type Context = ReturnType<typeof createContext>;
