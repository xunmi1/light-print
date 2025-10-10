import { test, expect } from '@playwright/test';
import { preventPrintDialog, loadPrintScript, mockPrint } from './utils';

test('emit print', async ({ page }) => {
  await page.evaluate(() => (document.body.innerHTML = '<div id="app">empty</div>'));
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
  const innerHTML = `<div id="app">empty</div>`;
  await page.evaluate(html => (document.body.innerHTML = html), innerHTML);

  const lightPrint = await loadPrintScript(page);
  await preventPrintDialog(page);

  await lightPrint('#app');
  expect(await page.locator('body').innerHTML()).toBe(innerHTML);
});
