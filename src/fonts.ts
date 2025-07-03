export function importFonts(doc: Document) {
  const fonts = doc.fonts;
  window.document.fonts?.forEach(font => fonts.add(font));
}

function NOOP() {}

export function waitFonts(doc: Document): Promise<void> | void {
  return doc.fonts?.ready.then(NOOP);
}
