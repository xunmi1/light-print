import { test, expect } from '@playwright/test';
import { delayNetwork, loadPrintScript, preventPrintDialog } from './utils';

test.describe('containing network resources', () => {
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
    await loadPrintScript(page);
    const task = page.evaluate(() => window.lightPrint('#app'));
    await expect(task).rejects.toThrow('Failed to load resource');
  });

  test('wait for resource loading', async ({ page }) => {
    await page.goto('/examples/index.html');
    const abortDelay = await delayNetwork(page, Infinity);
    await loadPrintScript(page);
    let status = 'pending';
    const task = page.evaluate(() => window.lightPrint('#app'));
    task.finally(() => (status = 'finished'));
    await page.waitForTimeout(500);
    expect(status).toBe('pending');
    await abortDelay();
    await expect(task).resolves.toBeUndefined();
  });
});
