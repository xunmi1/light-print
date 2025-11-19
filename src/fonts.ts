import { NOOP } from './utils';

export function tryImportFonts(doc: Document) {
  if (!doc.fonts) return;
  try {
    // If `document.fonts.forEach(...)` is used,
    // the console will still display uncaught exception messages.
    const iterator = window.document.fonts!.values();
    while (true) {
      const font = iterator.next().value;
      if (!font) break;
      // Can't add face to FontFaceSet that comes from `@font-face` rules for non-Chromium browsers.
      doc.fonts.add(font);
    }
  } catch {}
}

export function waitFonts(doc: Document): Promise<void> | void {
  return doc.fonts?.ready.then(NOOP);
}
