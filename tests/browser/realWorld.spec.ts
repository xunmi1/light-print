import { test, expect } from '@playwright/test';
import { preventDestroyContainer, preventPrintDialog, getPrintContainter, screenshot, loadPrintScript } from './utils';

test.use({ bypassCSP: true });

test.beforeEach(async ({ page, browserName }) => {
  // To cut test time, run tests only in `Chromium`.
  test.skip(browserName !== 'chromium');
  await page.emulateMedia({ colorScheme: 'dark' });
  await preventDestroyContainer(page);
  await preventPrintDialog(page);
});

test('Google Search', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 500, height: 1000 });
  await page.goto('https://www.google.com');
  page.evaluate(() => {
    document.body.id = 'app';
    const style = document.createElement('style');
    // Speed up execution
    style.textContent = `* { box-sizing: border-box }`;
    document.body.prepend(style);
  });
  // Hide `Choose Chrome` popup
  const popupLocator = page.locator('div', { hasText: 'Choose Chrome' });
  if ((await popupLocator.count()) > 0) await popupLocator.first().evaluate(el => (el.style.opacity = '0'));

  await screenshot(page.locator('#app'), { fileName: 'google.png', testInfo });
  const lightPrint = await loadPrintScript(page);
  await lightPrint('#app');
  const container = getPrintContainter(page);
  await container.evaluate(element => (element.style = 'width: 100%; height: 1000px; border: none'));
  const buffer = await screenshot(container.contentFrame().locator('#app'));
  expect(buffer).toMatchSnapshot('google.png', { maxDiffPixelRatio: 0.001 });
});

test('GitHub Repository', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1200, height: 1080 });
  test.setTimeout(120_000);
  await page.goto('https://github.com/xunmi1/light-print');
  page.evaluate(() => {
    document.body.id = 'app';
    const style = document.createElement('style');
    style.textContent = `* { box-sizing: border-box }`;
    document.body.prepend(style);
  });
  await screenshot(page.locator('#app'), { fileName: 'github.png', testInfo });
  const lightPrint = await loadPrintScript(page);
  // `.markdown-heading` has margin collapse problem.
  await lightPrint('#app', { mediaPrintStyle: '.markdown-heading { height: unset }' });
  const container = getPrintContainter(page);
  await container.evaluate(el => (el.style = 'width: 100%; height: 5000px; border: none'));
  const buffer = await screenshot(container.contentFrame().locator('#app'));
  expect(buffer).toMatchSnapshot('github.png', { maxDiffPixelRatio: 0.001 });
});

test('Node.js Homepage', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1500, height: 1080 });
  await page.goto('https://nodejs.org');
  await page.waitForTimeout(1000);
  page.evaluate(() => {
    document.body.id = 'app';
    const style = document.createElement('style');
    style.textContent = `*, :after, :before { box-sizing: border-box; border: 0 solid; margin: 0; padding: 0; }`;
    document.body.prepend(style);
  });
  await screenshot(page.locator('#app'), { fileName: 'nodejs.png', testInfo });
  const lightPrint = await loadPrintScript(page);
  await lightPrint('#app');
  const container = getPrintContainter(page);
  await container.evaluate(element => (element.style = 'width: 100%; height: 2000px; border: none'));
  const buffer = await screenshot(container.contentFrame().locator('#app'));
  expect(buffer).toMatchSnapshot('nodejs.png', { maxDiffPixelRatio: 0.003 });
});
