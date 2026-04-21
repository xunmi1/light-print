import { expect, test, vi } from 'vitest';
import lightPrint from 'src';

test('Promise', async () => {
  const withResolvers = window.Promise.withResolvers;
  // @ts-expect-error
  window.Promise.withResolvers = undefined;
  document.body.innerHTML = /* HTML */ `<div id="app"></div>`;
  await expect(lightPrint('#app')).resolves.toBeUndefined();
  // Restore `withResolvers`
  window.Promise.withResolvers = withResolvers;
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
  document.body.innerHTML = /* HTML */ `<div id="app"></div>`;
  await expect(lightPrint('#app')).resolves.toBeUndefined();
  vi.unstubAllGlobals();
});

// `happy-dom` doesn't support `compatMode`, precise validation happens in E2E tests.
test('compatMode', async () => {
  Object.defineProperty(document, 'compatMode', { value: 'BackCompat', configurable: true });
  await expect(lightPrint('#app')).resolves.toBeUndefined();
  // Restore `compatMode`
  Object.defineProperty(document, 'compatMode', { value: 'CSS1Compat', configurable: true });
});
