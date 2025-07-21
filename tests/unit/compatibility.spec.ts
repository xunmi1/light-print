import { expect, describe, test, vi } from 'vitest';
import lightPrint from '../../src';

describe('compatibility', async () => {
  test('Promise', async () => {
    // @ts-expect-error
    window.Promise.withResolvers = undefined;
    document.body.innerHTML = '<div id="app"></div>';
    await expect(lightPrint('#app')).resolves.toBeUndefined();
  });

  test('mock IE', async () => {
    const isIE = vi.hoisted(() => vi.fn(() => true));
    vi.mock(import('../../src/utils'), async importOriginal => {
      const original = await importOriginal();
      return { ...original, isIE };
    });
    document.body.innerHTML = '<div id="app"></div>';
    const lightPrint = await import('../../src/index').then(module => module.default);
    await expect(lightPrint('#app')).resolves.toBeUndefined();
    expect(isIE).toBeCalled();
  });
});
