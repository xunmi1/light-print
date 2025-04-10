let _printId = 1;

export function markPrintId(node: Element) {
  if (node.hasAttribute('data-print-id')) return node.getAttribute('data-print-id');
  const id = (_printId++).toString();
  node.setAttribute('data-print-id', id);
  return id;
}

export function resetPrintId() {
  _printId = 1;
}

export function getPrintIdSelector(node: Element) {
  const id = node.getAttribute('data-print-id');
  return id ? `[data-print-id="${id}"]` : undefined;
}
