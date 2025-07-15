import { test, expect, type TestInfo } from '@playwright/test';
import { delayNetwork, getScreenshotPath, round, roundBox } from './utils';

test('print() was called', async ({ page }) => {
  await page.goto('/examples/index.html');
  // To allow time for event binding, needs to be delay network 1s.
  await delayNetwork(page, 1000);
  await page.click('#print-action');
  await page.locator('body > iframe').waitFor({ state: 'attached' });
  page.evaluate(() => {
    // @ts-expect-error
    window.waitForPrint = new Promise(resolve => {
      const iframe = window.document.querySelector<HTMLIFrameElement>('body > iframe')!;
      // replace `print()`
      iframe.contentWindow!.print = () => resolve(true);
    });
  });
  // @ts-expect-error
  const handler = await page.waitForFunction(() => window.waitForPrint, null, { timeout: 5000 });
  const isCalled = await handler.jsonValue();
  expect(isCalled).toBe(true);
});

test('destroy() was called', async ({ page }, testInfo) => {
  // Only Chromium didn't display the print dialog and terminated the print process,
  // while other browsers remained on the print dialog, the `Playwright` can't close it.
  test.skip(testInfo.project.name !== 'chromium');
  await page.goto('/examples/index.html');
  await page.click('#print-action');
  await expect(page.locator('body > iframe')).not.toBeAttached();
});

test('visually consistent', async ({ page }, testInfo) => {
  const isWebkit = testInfo.project.name === 'webkit';
  if (isWebkit) testInfo.setTimeout(60_000);
  await page.setViewportSize({ width: 2000, height: 3000 });
  await page.goto('/examples/index.html');
  page.evaluate(preventDestroy);

  const action = page.locator('#print-action');
  // hide element
  await action.evaluate(element => (element.style.opacity = '0'));
  // trigger print
  await action.click();

  const iframe = page.locator('body > iframe');
  await expect(iframe).not.toBeVisible();
  // avoid scroll
  await iframe.evaluate(element => (element.style = 'width: 100%; height: 1500px'));
  const iframePage = iframe.contentFrame();
  const target = iframePage.locator('#app');
  const origin = page.locator('#app');
  const [originBox, targetBox] = await Promise.all([origin.boundingBox(), target.boundingBox()]);
  if (!originBox || !targetBox) throw new Error('Failed to get bounding box');

  expect(round(targetBox.width)).toEqual(round(originBox.width));
  expect(round(targetBox.height)).toEqual(round(originBox.height));
  // webkit browser does not support
  const maskSelectors = isWebkit ? ['#inputPlaceholder', '#inputFileSelectorButton', '#details'] : [];
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
      mask: maskSelectors.map(v => iframePage.locator(v)),
      maskColor: 'white',
    }),
  ]);

  await expect(targetBuffer).toMatchSnapshot('origin.png', { maxDiffPixelRatio: 0.005 });
});

/** @HACK to prevent destroy iframe */
function preventDestroy() {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child) {
    // @ts-expect-error
    if (child.localName === 'iframe') return child;
    return originalRemoveChild.call(this, child);
  };
}
