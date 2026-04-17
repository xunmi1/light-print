import { removeNode } from './utils';

declare global {
  interface Document {
    // In IE, `createTreeWalker` requires four arguments
    createTreeWalker(
      root: Node,
      whatToShow: number,
      filter: NodeFilter | null,
      expandEntityReferences: boolean
    ): TreeWalker;
  }
}

export interface ElementWalker<Root extends Node> extends TreeWalker {
  currentNode: Element | Root;
  nextNode(): Element | null;
  nextSibling(): Element | null;
  parentNode(): Element | null;
}

function createElementWalker<T extends Node>(root: T) {
  // `1` is `NodeFilter.SHOW_ELEMENT`
  return window.document.createTreeWalker(root, 1, null, false) as ElementWalker<T>;
}

/**
 * Traverse the DOM tree.
 * When the `visitor` returns `false`, the current element and its subtree will be skipped and removed.
 * Do not rely on element-specific properties.
 */
export function traverse<T extends ParentNode>(
  visitor: <U extends Element | T>(target: U, origin: U) => boolean,
  target: T,
  origin: T
) {
  const targetWalker = createElementWalker(target);
  const originWalker = createElementWalker(origin);
  while (true) {
    const isNext = visitor(targetWalker.currentNode, originWalker.currentNode);
    if (isNext) {
      if (!(targetWalker.nextNode() && originWalker.nextNode())) break;
    } else {
      const skippedNode = targetWalker.currentNode;
      let hasParent = true;
      while (true) {
        const hasSibling = targetWalker.nextSibling() && originWalker.nextSibling();
        if (hasSibling) break;
        // If the current element has no next sibling, move to the next sibling of its parent.
        hasParent = !!(targetWalker.parentNode() && originWalker.parentNode());
        if (!hasParent) break;
      }
      // Remove the skipped element and its subtree, to prevent any resources from being loaded.
      removeNode(skippedNode);
      if (!hasParent) break;
    }
  }
}
