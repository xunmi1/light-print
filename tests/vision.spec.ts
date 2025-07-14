import { test, expect, type TestInfo } from '@playwright/test';

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
  // avoid scroll
  await iframe.evaluate(element => (element.style = 'width: 100%; height: 1500px'));
  const iframePage = iframe.contentFrame();
  const target = iframePage.locator('#app');
  const origin = page.locator('#app');
  const [originBox, targetBox] = await Promise.all([origin.boundingBox(), target.boundingBox()]);
  if (!originBox || !targetBox) throw new Error('Failed to get bounding box');

  expect(round(targetBox.width, 2)).toEqual(round(originBox.width, 2));
  expect(round(targetBox.height, 2)).toEqual(round(originBox.height, 2));

  // The screenshot dimensions from `element.screenshot()` are inconsistent,
  // so we're using `page.screenshot()` instead.
  const [_, targetBuffer] = await Promise.all([
    page.screenshot({
      path: getScreenshotPath('origin', testInfo),
      clip: roundBox(originBox),
      fullPage: true,
    }),
    page.screenshot({
      clip: roundBox(targetBox),
      fullPage: true,
    }),
  ]);

  await expect(targetBuffer).toMatchSnapshot('origin.png', { maxDiffPixelRatio: 0.005 });
});

function getScreenshotPath(name: string, testInfo: TestInfo) {
  // need to be the same as `snapshotPathTemplate` config
  return `tests/__screenshots__/${name}-${process.platform}-${testInfo.project.name}.png`;
}

function round(number: number, precision = 0) {
  return Math.round(number * 10 ** precision) / 10 ** precision;
}

function roundBox(rect: Record<string, number>, precision = 0) {
  return {
    x: round(rect.x, precision),
    y: round(rect.y, precision),
    width: round(rect.width, precision),
    height: round(rect.height, precision),
  };
}

/** @HACK to prevent destroy iframe */
function preventDestroy() {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child) {
    // @ts-expect-error
    if (child.localName === 'iframe') return child;
    return originalRemoveChild.apply(this, arguments);
  };
}
