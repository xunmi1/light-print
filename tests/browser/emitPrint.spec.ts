import { test, expect } from '@playwright/test';
import { getPrintContainter, preventPrintDialog, loadPrintScript } from './utils';

test('emit print', async ({ page }) => {
  await page.evaluate(() => (document.body.innerHTML = '<div id="app">empty</div>'));
  await page.exposeBinding('print', ({ page }) => {
    // @ts-expect-error
    return page.evaluate(() => (window.isEmitPrint = true));
  });
  await loadPrintScript(page);
  await page.evaluate(() => {
    window.lightPrint('#app');
  });
  await getPrintContainter(page).waitFor({ state: 'attached' });
  // @ts-expect-error
  const handler = await page.waitForFunction(() => window.isEmitPrint, null, { timeout: 5000 });
  const isCalled = await handler.jsonValue();
  expect(isCalled).toBe(true);
});

test('destroy', async ({ page }) => {
  const innerHTML = `<div id="app">empty</div>`;
  await page.evaluate(html => (document.body.innerHTML = html), innerHTML);

  await loadPrintScript(page);
  await preventPrintDialog(page);

  await page.evaluate(() => window.lightPrint('#app'));
  expect(await page.locator('body').innerHTML()).toBe(innerHTML);
});
