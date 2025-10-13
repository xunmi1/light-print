import { test, expect } from '@playwright/test';
import { preventDestroyContainer, preventPrintDialog, getPrintContainter, screenshot, pauseMedia } from './utils';

test.use({ viewport: { width: 1920, height: 1080 } });
test.beforeEach(async ({ page }) => {
  await preventDestroyContainer(page);
  await preventPrintDialog(page);
});

test('repeat prints should be identical', async ({ page }, testInfo) => {
  await page.goto('/examples/index.html');
  await pauseMedia(page);
  const action = page.locator('#print-action');
  // hide element
  await action.evaluate(element => (element.style.opacity = '0'));
  // trigger twice consecutively
  await Promise.all([action.click(), action.click()]);

  const containters = getPrintContainter(page);
  // avoid container scrolling
  await containters.evaluateAll(elements =>
    elements.forEach(element => (element.style = 'width: 100%; height: 1500px'))
  );

  await expect(containters).toHaveCount(2);

  const first = containters.first().contentFrame().locator('#app');
  const last = containters.last().contentFrame().locator('#app');

  await screenshot(first, { fileName: 'repeat.png', testInfo });
  const repeatLast = await screenshot(last);
  expect(repeatLast).toMatchSnapshot('repeat.png', { maxDiffPixelRatio: 0.005 });
});
