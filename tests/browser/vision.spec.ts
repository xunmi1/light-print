import { test, expect } from '@playwright/test';
import { getPrintContainter, getScreenshotPath, round, roundBox, preventDestroyContainer } from './utils';

test.use({ viewport: { width: 1920, height: 1080 } });

test('visually consistent', async ({ page }, testInfo) => {
  const isWebKit = testInfo.project.name === 'webkit';
  if (isWebKit) testInfo.setTimeout(60_000);
  await page.goto('/examples/index.html');
  await page.evaluate(preventDestroyContainer);

  const action = page.locator('#print-action');
  // hide element
  await action.evaluate(element => (element.style.opacity = '0'));
  // trigger print
  await action.click();

  const container = getPrintContainter(page);
  await expect(container).toBeHidden();
  // avoid container scrolling
  await container.evaluate(element => (element.style = 'width: 100%; height: 1500px'));
  const frame = container.contentFrame();
  const target = frame.locator('#app');
  const origin = page.locator('#app');
  const [originBox, targetBox] = await Promise.all([origin.boundingBox(), target.boundingBox()]);
  if (!originBox || !targetBox) throw new Error('Failed to get bounding box');

  expect(round(targetBox.width)).toBe(round(originBox.width));
  expect(round(targetBox.height)).toBe(round(originBox.height));
  // webkit browser does not support
  const maskSelectors = isWebKit ? ['#inputPlaceholder', '#inputFileSelectorButton', '#details'] : [];
  // The screenshot dimensions from `element.screenshot()` are inconsistent,
  // so we're using `page.screenshot()` instead.
  const [_, targetBuffer] = await Promise.all([
    page.screenshot({
      path: getScreenshotPath('origin', testInfo),
      clip: roundBox(originBox),
      fullPage: true,
      mask: maskSelectors.map(v => page.locator(v)),
      maskColor: 'white',
    }),
    page.screenshot({
      clip: roundBox(targetBox),
      fullPage: true,
      mask: maskSelectors.map(v => frame.locator(v)),
      maskColor: 'white',
    }),
  ]);

  expect(targetBuffer).toMatchSnapshot('origin.png', { maxDiffPixelRatio: 0.005 });
});
