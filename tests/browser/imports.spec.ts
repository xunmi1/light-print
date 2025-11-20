import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getPageErrors, preventPrintDialog } from './utils';

test.beforeEach(async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium');
  await preventPrintDialog(page);
});

test('ES Module', async ({ page }) => {
  await page.goto('/examples/nest.html');
  const errors = getPageErrors(page);
  await page.addScriptTag({
    type: 'module',
    content: `
      import lightPrint from '../dist/light-print.js';
      await lightPrint('body');
    `,
  });
  expect(errors).toHaveLength(0);
});

test('IIFE', async ({ page }) => {
  await page.goto('/examples/nest.html');
  const errors = getPageErrors(page);
  await page.addScriptTag({ path: 'dist/light-print.global.js' });
  // @ts-expect-error
  await page.evaluate(() => window.lightPrint('body'));
  expect(errors).toHaveLength(0);
});

test('CommonJS', async ({ page }) => {
  const errors = getPageErrors(page);
  const scriptRaw = await readFile('dist/light-print.cjs', 'utf-8');
  await page.addScriptTag({
    content: `
      // mock require environment
      const module = { exports: {} };
      const exports = module.exports;
      ${scriptRaw}
      window.lightPrint = module.exports;
    `,
  });
  // @ts-expect-error
  await page.evaluate(() => window.lightPrint('body'));
  expect(errors).toHaveLength(0);
});
