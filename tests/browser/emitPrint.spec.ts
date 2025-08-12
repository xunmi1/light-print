import { test, expect } from '@playwright/test';
import { delayNetwork, getPrintContainter, preventPrintDialog } from './utils';

test('emit print', async ({ page }) => {
  await page.goto('/examples/index.html');
  // To allow time for event binding, needs to be delay network.
  const abort = await delayNetwork(page, Infinity);
  await page.click('#print-action');
  await getPrintContainter(page).waitFor({ state: 'attached' });
  await page.evaluate(() => {
    // @ts-expect-error
    window.waitForPrint = new Promise(resolve => {
      const iframe = window.document.querySelector<HTMLIFrameElement>('body > iframe')!;
      // replace `print()`
      iframe.contentWindow!.print = () => resolve(true);
    });
  });
  await abort();
  // @ts-expect-error
  const handler = await page.waitForFunction(() => window.waitForPrint, null, { timeout: 5000 });
  const isCalled = await handler.jsonValue();
  expect(isCalled).toBe(true);
});

test('destroy', async ({ page }) => {
  await page.goto('/examples/index.html');
  const innerHTML = await page.locator('body').innerHTML();
  const container = await preventPrintDialog(page, async () => {
    await page.click('#print-action');
  });
  // Only Chromium didn't display the print dialog and terminated the print process,
  // while other browsers remained on the print dialog, the `Playwright` can't close it.
  await expect(container).not.toBeAttached();
  expect(await page.locator('body').innerHTML()).toBe(innerHTML);
});
