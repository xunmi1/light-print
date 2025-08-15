import { test, expect } from '@playwright/test';
import { preventDestroyContainer, preventPrintDialog, getPrintContainter, screenshot } from './utils';

test.use({ viewport: { width: 1920, height: 1080 } });
test.beforeEach(async ({ page }) => {
  await preventDestroyContainer(page);
  await preventPrintDialog(page);
});

test('repeat prints should be identical', async ({ page }, testInfo) => {
  await page.goto('/examples/index.html');
  // trigger twice consecutively
  await Promise.all([page.click('#print-action'), page.click('#print-action')]);

  const containters = getPrintContainter(page);

  // avoid container scrolling
  await containters.evaluateAll(elements =>
    elements.forEach(element => (element.style = 'width: 100%; height: 1500px'))
  );

  await expect(containters).toHaveCount(2);

  const first = containters.first().contentFrame().locator('#app');
  const last = containters.last().contentFrame().locator('#app');

  await screenshot(page, first, { fileName: 'repeat-first.png', testInfo });
  const repeatLast = await screenshot(page, last);
  // Firefox has rendering position discrepancies in CI.
  const maxDiffPixelRatio = testInfo.project.name === 'firefox' ? 0.005 : 0;
  expect(repeatLast).toMatchSnapshot('repeat-first.png', { maxDiffPixelRatio });
});
