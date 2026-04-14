import { expect, describe, test, vi } from 'vitest';
import lightPrint from 'src';

describe('compatibility', () => {
  test('Promise', async () => {
    // @ts-expect-error
    window.Promise.withResolvers = undefined;
    document.body.innerHTML = /* HTML */ `<div id="app"></div>`;
    await expect(lightPrint('#app')).resolves.toBeUndefined();
  });

  test('mock IE', async () => {
    const mockIE = new Window({
      settings: {
        navigator: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Trident/7.0; rv:11.0) like Gecko',
        },
      },
    });
    vi.stubGlobal('navigator', mockIE.navigator);
    window.document.body.innerHTML = /* HTML */ `<div id="app"></div>`;
    await expect(lightPrint('#app')).resolves.toBeUndefined();
    vi.unstubAllGlobals();
  });
});
