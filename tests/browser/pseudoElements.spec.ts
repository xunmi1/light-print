import { test, expect } from '@playwright/test';
import { loadPrintScript, preventPrintDialog, preventDestroyContainer, getPrintContainter, screenshot } from './utils';

test.beforeEach(async ({ page }) => {
  await preventPrintDialog(page);
  await preventDestroyContainer(page);
});

test('::before & ::after', async ({ page }, testInfo) => {
  await page.evaluate(() => {
    document.body.innerHTML = `
      <style>
        #app { width: 100px; height: 50px; }
        #app::before { content: 'before'; color: red; }
        #app::after { content: 'after'; color: blue; }
      </style>
      <div id="app"></div>
    `;
  });
  const lightPrint = await loadPrintScript(page);
  await lightPrint('#app');
  const container = getPrintContainter(page);
  container.evaluate(element => (element.style = 'width: 200px; height: 200px'));

  await screenshot(page.locator('#app'), { fileName: 'pseudo-before-after.png', testInfo });
  const buffer = await screenshot(container.contentFrame().locator('#app'));
  expect(buffer).toMatchSnapshot('pseudo-before-after.png');
});

test('::marker', async ({ page, browserName }, testInfo) => {
  test.skip(browserName === 'webkit', 'WebKit does not support `::marker`');
  await page.evaluate(() => {
    document.body.innerHTML = `
      <style>
        .marker {
          height: 50px;
          list-style-position: inside;
          &::marker { content: '❤️'; font-size: 30px; }
        }
      </style>
      <div id="app" style="width: 100px;">
        <div class="marker" style="display: list-item"></div>
        <div class="marker"></div>
      </div>
    `;
  });
  const lightPrint = await loadPrintScript(page);
  await lightPrint('#app');
  const container = getPrintContainter(page);
  container.evaluate(element => (element.style = 'width: 200px; height: 200px'));

  await screenshot(page.locator('#app'), { fileName: 'pseudo-marker.png', testInfo });
  const buffer = await screenshot(container.contentFrame().locator('#app'));
  expect(buffer).toMatchSnapshot('pseudo-marker.png');
});

test('::first-letter & ::first-line', async ({ page }, testInfo) => {
  await page.evaluate(() => {
    document.body.innerHTML = `
      <style>
        #app::first-letter { font-size: 2rem; color: red; float: left; }
        #app::first-line { color: blue; }
      </style>
      <div id="app" style="width: 150px">
        <p>First letter and first line</p>
        <p>Second line</p>
      </div>
    `;
  });
  const lightPrint = await loadPrintScript(page);
  await lightPrint('#app');
  const container = getPrintContainter(page);
  container.evaluate(element => (element.style = 'width: 200px; height: 200px'));

  await screenshot(page.locator('#app'), { fileName: 'pseudo-first-letter-line.png', testInfo });
  const buffer = await screenshot(container.contentFrame().locator('#app'));
  expect(buffer).toMatchSnapshot('pseudo-first-letter-line.png');
});

test('::placeholder', async ({ page, browserName }, testInfo) => {
  test.skip(browserName === 'webkit', 'WebKit does not support `::placeholder`');
  await page.evaluate(() => {
    document.body.innerHTML = `
      <style>
        #app { width: 200px; display: flex; flex-direction: column; gap: 1rem; }
        *::placeholder { background: darkblue; color: white; }
      </style>
      <div id="app">
        <input placeholder="placeholder" />
        <textarea placeholder="placeholder"></textarea>
        <input value="value" />
        <textarea value="value"></textarea>
        <div placeholder="placeholder"></div>
      </div>
    `;
  });
  const lightPrint = await loadPrintScript(page);
  await lightPrint('#app');
  const container = getPrintContainter(page);
  container.evaluate(element => (element.style = 'width: 300px; height: 300px'));

  await screenshot(page.locator('#app'), { fileName: 'pseudo-placeholder.png', testInfo });
  const buffer = await screenshot(container.contentFrame().locator('#app'));
  expect(buffer).toMatchSnapshot('pseudo-placeholder.png');
});

test('::file-selector-button', async ({ page, browserName }, testInfo) => {
  test.skip(browserName === 'webkit', 'WebKit does not support `::file-selector-button`');
  await page.evaluate(() => {
    document.body.innerHTML = `
      <style>
        #app { width: 200px; display: flex; flex-direction: column; gap: 1rem; }
        input::file-selector-button { background: darkblue; color: white; }
      </style>
      <div id="app">
        <input type="file" />
        <input type="text" value="value" />
      </div>
    `;
  });
  const lightPrint = await loadPrintScript(page);
  await lightPrint('#app');
  const container = getPrintContainter(page);
  container.evaluate(element => (element.style = 'width: 300px; height: 300px'));

  await screenshot(page.locator('#app'), { fileName: 'pseudo-file-selector-button.png', testInfo });
  const buffer = await screenshot(container.contentFrame().locator('#app'));
  expect(buffer).toMatchSnapshot('pseudo-file-selector-button.png');
});

test('::details-content', async ({ page, browserName }, testInfo) => {
  test.skip(browserName === 'webkit', 'WebKit does not support `::details-content`');
  await page.evaluate(() => {
    document.body.innerHTML = `
      <style>
        details::details-content { background: blue; color: white; }
        details > div { line-height: 1.5rem; padding: 1rem; }
      </style>
      <div id="app" style="width: 200px;">
        <details open>
          <summary>Header</summary>
          <div>Details content</p>
        </details>
      </div>
    `;
  });
  const lightPrint = await loadPrintScript(page);
  await lightPrint('#app');
  const container = getPrintContainter(page);
  container.evaluate(element => (element.style = 'width: 300px; height: 300px'));

  await screenshot(page.locator('#app'), { fileName: 'pseudo-details-content.png', testInfo });
  const buffer = await screenshot(container.contentFrame().locator('#app'));
  expect(buffer).toMatchSnapshot('pseudo-details-content.png');
});
