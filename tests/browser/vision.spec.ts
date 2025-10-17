import { test, expect } from '@playwright/test';
import {
  getPrintContainter,
  screenshot,
  preventDestroyContainer,
  preventPrintDialog,
  loadPrintScript,
  pauseMedia,
  roundClip,
} from './utils';

test.use({ viewport: { width: 1920, height: 1080 } });
test.beforeEach(async ({ page }) => {
  await preventDestroyContainer(page);
  await preventPrintDialog(page);
});

test('visually consistent', async ({ page }, testInfo) => {
  await page.goto('/examples/index.html');
  await pauseMedia(page);
  const action = page.locator('#print-action');
  // hide element
  await action.evaluate(element => (element.style.opacity = '0'));
  const origin = page.locator('#app');
  await screenshot(origin, { fileName: 'origin.png', testInfo });
  // trigger print
  await action.click();

  const container = getPrintContainter(page);
  await expect(container).toBeHidden();
  // avoid container scrolling
  await container.evaluate(element => (element.style = 'width: 100%; height: 1500px'));
  const frame = container.contentFrame();

  const target = frame.locator('#app');
  // `Playwright` screenshots often have slight dimension drift,
  // so we lock the exact width and height manually.
  const originClip = roundClip((await origin.boundingBox())!);
  const targetBuffer = await screenshot(target, { size: { width: originClip.width, height: originClip.height } });

  expect(targetBuffer).toMatchSnapshot('origin.png', { maxDiffPixelRatio: 0.005 });
});

test('append style', async ({ page }, testInfo) => {
  await page.evaluate(() => (document.body.innerHTML = `<div id="app">append style</div>`));
  page.addStyleTag({ content: '#app { background: yellow; height: 10rem; width: 10rem; font-size: 2rem }' });

  const appendedStyle = '#app { background: blue }';

  const lightPrint = await loadPrintScript(page);
  await lightPrint('#app', { mediaPrintStyle: appendedStyle });

  const container = getPrintContainter(page);
  await container.evaluate(element => (element.style = 'width: 100%; height: 500px'));

  await screenshot(page.locator('#app'), { fileName: 'append-before.png', testInfo });
  const targetBuffer = await screenshot(container.contentFrame().locator('#app'));
  expect(targetBuffer).not.toMatchSnapshot('append-before.png');

  page.addStyleTag({ content: appendedStyle });
  await screenshot(page.locator('#app'), { fileName: 'append-after.png', testInfo });
  expect(targetBuffer).toMatchSnapshot('append-after.png');
});
