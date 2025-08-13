import { test, expect } from '@playwright/test';
import { preventDestroyContainer, preventPrintDialog, screenshot } from './utils';

test.use({ viewport: { width: 1920, height: 1080 } });

test('repeat prints should be identical', async ({ page }, testInfo) => {
  const isWebKit = testInfo.project.name === 'webkit';
  if (isWebKit) testInfo.setTimeout(60_000);

  await page.goto('/examples/index.html');
  await page.evaluate(preventDestroyContainer);

  const containters = await preventPrintDialog(page, async () => {
    // trigger twice consecutively
    await Promise.all([page.click('#print-action'), page.click('#print-action')]);
  });

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
