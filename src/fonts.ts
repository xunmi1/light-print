import { NOOP } from './utils';

declare global {
  interface Document {
    // `IE` does not support `Document.fonts`
    fonts?: FontFaceSet;
  }
}

export function tryImportFonts(doc: Document) {
  if (!doc.fonts) return;
  try {
    // If `document.fonts.forEach(...)` is used,
    // the console will still display uncaught exception messages.
    const iterator = window.document.fonts!.values();
    while (true) {
      const font = iterator.next().value;
      if (!font) break;
      // In non-Chromium browsers, fonts introduced via `@font-face` rules cannot be added to new windows.
      doc.fonts.add(font);
    }
  } catch {}
}

export function waitForFonts(doc: Document): Promise<void> | void {
  return doc.fonts?.ready.then(NOOP);
}
