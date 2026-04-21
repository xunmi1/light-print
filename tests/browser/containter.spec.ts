import { test, expect } from '@playwright/test';
import { preventPrintDialog, loadPrintScript, getPrintContainter, preventDestroyContainer } from './utils';

test.beforeEach(async ({ page }) => {
  await preventPrintDialog(page);
  await preventDestroyContainer(page);
});

test('container is hidden', async ({ page }) => {
  await page.evaluate(() => {
    document.body.innerHTML = /* HTML */ `<div id="app">empty</div>`;
  });
  const lightPrint = await loadPrintScript(page);
  await lightPrint('#app');
  const container = getPrintContainter(page);
  await expect(container).toBeHidden();
});

test('document in quirks mode', async ({ page }) => {
  await page.evaluate(() => {
    document.write(
      /* HTML */ `<html>
        <body>
          <div id="app">quirks mode</div>
        </body>
      </html>`
    );
  });

  const lightPrint = await loadPrintScript(page);
  await lightPrint('#app');
  const container = getPrintContainter(page);
  const compatMode = await container.evaluate((el: HTMLIFrameElement) => el.contentDocument!.compatMode);
  expect(compatMode).toBe('BackCompat');
});
