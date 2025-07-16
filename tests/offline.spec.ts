import { test, expect } from '@playwright/test';

test('no printing when offline', async ({ page, context }) => {
  // disable network cache
  await page.route('**/*', route => {
    const headers = route.request().headers();
    headers['Cache-Control'] = 'no-cache';
    headers['Pragma'] = 'no-cache';
    route.continue({ headers });
  });
  await page.goto('/examples/index.html');
  await context.setOffline(true);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.click('#print-action');
  await page.waitForTimeout(500);
  expect(errors.join('\n')).toContain('Failed to load resource');
});
