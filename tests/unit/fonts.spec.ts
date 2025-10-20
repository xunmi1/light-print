import { describe, expect, test } from 'vitest';
import type { Document } from 'happy-dom';
import { tryImportFonts, waitFonts } from 'src/fonts';

// `happy-dom` doesn't support `FontFaceSet` API
// https://github.com/capricorn86/happy-dom/issues/1478
type FontFaceSet = EventTarget & Set<string> & { ready: Promise<FontFaceSet> };

declare module 'happy-dom' {
  interface Document {
    fonts: FontFaceSet;
  }
}

function mockFontsAPI(doc: Document, fonts: string[] = []) {
  const fontSet = new Set(fonts) as FontFaceSet;
  fontSet.ready = Promise.resolve(fontSet);
  fontSet.addEventListener = () => {};
  fontSet.removeEventListener = () => {};
  fontSet.dispatchEvent = () => true;
  doc.fonts = fontSet;
}

describe('import fonts', () => {
  test('has fonts API', async () => {
    const newDocument = new Window().document;
    mockFontsAPI(document, ['font1', 'font2']);
    mockFontsAPI(newDocument);

    tryImportFonts(newDocument);
    expect(newDocument.fonts.size).toBe(2);
  });

  test('no fonts API', async () => {
    const newDocument = new Window().document;
    tryImportFonts(newDocument);
    expect(newDocument.fonts?.size).toBeFalsy();

    mockFontsAPI(newDocument);
    newDocument.fonts.add = () => {
      throw new Error();
    };

    tryImportFonts(newDocument);
    expect(newDocument.fonts?.size).toBeFalsy();
  });
});

describe('wait fonts', () => {
  test('has fonts API', async () => {
    const newDocument = new Window().document;
    mockFontsAPI(document, ['font1', 'font2']);
    mockFontsAPI(newDocument);
    tryImportFonts(newDocument);
    await expect(waitFonts(newDocument)).resolves.toBeUndefined();
  });

  test('no fonts API', async () => {
    const newDocument = new Window().document;
    expect(waitFonts(newDocument)).toBeUndefined();
  });
});
