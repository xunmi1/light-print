import { test, expect } from '@playwright/test';
import { preventPrintDialog, loadPrintScript, mockPrint } from './utils';

test('emit print', async ({ page }) => {
  await page.evaluate(() => (document.body.innerHTML = /* HTML */ `<div id="app">empty</div>`));
  const { promise, resolve } = Promise.withResolvers<void>();
  await page.exposeBinding('print', ({ frame }) => {
    resolve();
    return frame.evaluate(mockPrint);
  });
  const lightPrint = await loadPrintScript(page);
  await lightPrint('#app');
  await expect(promise).resolves.toBeUndefined();
});

test('destroy', async ({ page }) => {
  await preventPrintDialog(page);
  const innerHTML = /* HTML */ `<div id="app">empty</div>`;
  await page.evaluate(html => (document.body.innerHTML = html), innerHTML);

  const lightPrint = await loadPrintScript(page);

  await lightPrint('#app');
  expect(await page.locator('body').innerHTML()).toBe(innerHTML);
});

test.describe('abort signal', () => {
  const innerHTML = /* HTML */ `<div id="app">empty</div>`;
  test.beforeEach(async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium');
    await preventPrintDialog(page);
    await page.evaluate(html => (document.body.innerHTML = html), innerHTML);
  });

  test('abort before printing', async ({ page }) => {
    await page.addScriptTag({ path: 'dist/light-print.global.js' });
    const result = page.evaluate(() => {
      // @ts-expect-error
      return window.lightPrint('#app', { signal: AbortSignal.abort() });
    });
    await expect(result).rejects.toThrow(Error);
    await expect(result).rejects.toThrow('AbortError');
    expect(await page.locator('body').innerHTML()).toBe(innerHTML);
  });

  test('abort when printing', async ({ page }) => {
    await page.addScriptTag({ path: 'dist/light-print.global.js' });
    const result = page.evaluate(() => {
      const abortController = new AbortController();
      // @ts-expect-error
      const promise = window.lightPrint('#app', { signal: abortController.signal });
      abortController.abort();
      return promise;
    });
    await expect(result).rejects.toThrow(Error);
    await expect(result).rejects.toThrow('AbortError');
    expect(await page.locator('body').innerHTML()).toBe(innerHTML);
  });

  test('abort after printing', async ({ page }) => {
    await page.addScriptTag({ path: 'dist/light-print.global.js' });
    const result = page.evaluate(() => {
      // @ts-expect-error
      return window.lightPrint('#app', { signal: AbortSignal.timeout(10000) });
    });
    await expect(result).resolves.toBeUndefined();
    expect(await page.locator('body').innerHTML()).toBe(innerHTML);
  });
});
