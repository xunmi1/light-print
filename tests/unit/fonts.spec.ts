import { expect, test, vi } from 'vitest';
import { Document } from 'happy-dom';

import lightPrint from 'src';

test('fonts', async () => {
  // `happy-dom` doesn't support `document.fonts`,
  // https://github.com/capricorn86/happy-dom/issues/1478
  const add = vi.fn();
  const fonts = new Set(['font1', 'font2']);
  // @ts-expect-error
  fonts.ready = Promise.resolve();
  fonts.add = add;
  // @ts-expect-error
  Document.prototype.fonts = fonts;

  await expect(lightPrint('body')).resolves.toBeUndefined();
  expect(add).toBeCalledTimes(fonts.size);
  fonts.add = () => {
    throw new Error('cannot add fonts');
  };
  await expect(lightPrint('body')).resolves.toBeUndefined();
});
