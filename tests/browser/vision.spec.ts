import { test, expect } from '@playwright/test';
import { getPrintContainter, screenshot, preventDestroyContainer, preventPrintDialog, loadPrintScript } from './utils';

test.use({ viewport: { width: 1920, height: 1080 } });
test.beforeEach(async ({ page }) => {
  await preventDestroyContainer(page);
  await preventPrintDialog(page);
});

test('visually consistent', async ({ page, browserName }, testInfo) => {
  await page.goto('/examples/index.html');

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
  const isWebKit = browserName === 'webkit';
  // WebKit browsers do not support certain pseudo-elements.
  const maskSelectors = isWebKit ? ['#inputPlaceholder', '#inputFileSelectorButton', '#details'] : [];

  await screenshot(page, origin, { fileName: 'origin.png', testInfo, mask: maskSelectors.map(v => page.locator(v)) });
  const targetBuffer = await screenshot(page, target, { mask: maskSelectors.map(v => frame.locator(v)) });

  expect(targetBuffer).toMatchSnapshot('origin.png', { maxDiffPixelRatio: 0.005 });
});

test('append style', async ({ page }, testInfo) => {
  await page.evaluate(() => (document.body.innerHTML = `<div id="app">append style</div>`));
  page.addStyleTag({ content: '#app { background: yellow; height: 10rem; width: 10rem; font-size: 2rem }' });

  const appendedStyle = '#app { background: blue !important; }';

  await loadPrintScript(page);
  await page.evaluate(style => {
    window.lightPrint('#app', { mediaPrintStyle: style });
  }, appendedStyle);

  const container = getPrintContainter(page);
  await container.evaluate(element => (element.style = 'width: 100%; height: 500px'));

  await screenshot(page, page.locator('#app'), { fileName: 'append-before.png', testInfo });
  const targetBuffer = await screenshot(page, container.contentFrame().locator('#app'));
  expect(targetBuffer).not.toMatchSnapshot('append-before.png');

  page.addStyleTag({ content: appendedStyle });
  await screenshot(page, page.locator('#app'), { fileName: 'append-after.png', testInfo });
  expect(targetBuffer).toMatchSnapshot('append-after.png');
});
