import { test, expect } from '@playwright/test';
import { loadPrintScript, preventPrintDialog } from './utils';

test.beforeEach(async ({ page }) => {
  await preventPrintDialog(page);
});

test("can't be printed when offline", async ({ page }) => {
  // disable network cache
  await page.route('**/*', route => {
    const headers = route.request().headers();
    headers['Cache-Control'] = 'no-cache';
    headers['Pragma'] = 'no-cache';
    route.continue({ headers });
  });
  await page.goto('/examples/index.html');
  await page.context().setOffline(true);
  const lightPrint = await loadPrintScript(page);
  await expect(lightPrint('#app')).rejects.toThrowError('Failed to load resource');
});
