import { test, expect } from '@playwright/test';
import { delayNetwork, getPrintContainter, getScreenshotPath, round, roundBox } from './utils';

test('print() was called', async ({ page }) => {
  await page.goto('/examples/index.html');
  // To allow time for event binding, needs to be delay network 1s.
  await delayNetwork(page, 2000);
  await page.click('#print-action');
  await getPrintContainter(page).waitFor({ state: 'attached' });
  await page.evaluate(() => {
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
  await page.goto('/examples/index.html');
  await delayNetwork(page, 1000);
  await page.click('#print-action');
  const container = getPrintContainter(page);
  await expect(container).toBeAttached();
  // Only Chromium didn't display the print dialog and terminated the print process,
  // while other browsers remained on the print dialog, the `Playwright` can't close it.
  if (testInfo.project.name === 'chromium') {
    await expect(container).not.toBeAttached();
  }
});

test('visually consistent', async ({ page }, testInfo) => {
  const isWebKit = testInfo.project.name === 'webkit';
  if (isWebKit) testInfo.setTimeout(60_000);
  await page.setViewportSize({ width: 2000, height: 3000 });
  await page.goto('/examples/index.html');
  await page.evaluate(preventDestroyContainer);

  const action = page.locator('#print-action');
  // hide element
  await action.evaluate(element => (element.style.opacity = '0'));
  // trigger print
  await action.click();

  const container = getPrintContainter(page);
  await expect(container).toBeHidden();
  // avoid scroll
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

  await expect(targetBuffer).toMatchSnapshot('origin.png', { maxDiffPixelRatio: 0.005 });
});

/** @HACK prevent destroy iframe container */
function preventDestroyContainer() {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T) {
    if ('localName' in child && child.localName === 'iframe') return child;
    return originalRemoveChild.call(this, child) as T;
  };
}
