export function importFonts(currentWindow: Window) {
  const fonts = currentWindow.document.fonts;
  window.document.fonts?.forEach(font => fonts.add(font));
}

function NOOP() {}

export function waitFonts(currentWindow: Window): Promise<void> | void {
  return currentWindow.document.fonts?.ready.then(NOOP);
}
