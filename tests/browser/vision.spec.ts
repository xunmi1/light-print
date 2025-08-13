import { test, expect } from '@playwright/test';
import { getPrintContainter, screenshot, round, preventDestroyContainer } from './utils';

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
  // WebKit browsers do not support certain pseudo-elements.
  const maskSelectors = isWebKit ? ['#inputPlaceholder', '#inputFileSelectorButton', '#details'] : [];

  await screenshot(page, origin, { fileName: 'origin.png', testInfo, mask: maskSelectors.map(v => page.locator(v)) });
  const targetBuffer = await screenshot(page, target, { mask: maskSelectors.map(v => frame.locator(v)) });

  expect(targetBuffer).toMatchSnapshot('origin.png', { maxDiffPixelRatio: 0.005 });
});
