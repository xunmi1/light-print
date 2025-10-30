import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { loadPrintScript, preventPrintDialog, preventDestroyContainer, getPrintContainter, screenshot } from './utils';

test.beforeEach(async ({ page }) => {
  await preventPrintDialog(page);
  await preventDestroyContainer(page);
});

test.describe('display: table', () => {
  test('table-layout: fixed', async ({ page }) => {
    await page.evaluate(() => {
      document.body.innerHTML = `
        <style>
          table { table-layout: fixed; width: 100%; }
          .ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        </style>
        <div id="app" style="width: 50px;">
          <table>
            <tr>
              <td>
                <div class="ellipsis">Hello light-print. Lightweight HTML element printing for browsers.</div>
              </td>
            </tr>
          </table>
        </div>
      `;
    });
    const originRect = await page.locator('table').evaluate(el => el.getBoundingClientRect());
    expect(originRect.width).toBe(50);

    const lightPrint = await loadPrintScript(page);
    await lightPrint('#app');
    const frame = getPrintContainter(page).contentFrame();

    const targetRect = await frame.locator('table').evaluate(el => el.getBoundingClientRect());
    expect(targetRect.width).toBe(50);
  });

  test('table-layout: auto', async ({ page }) => {
    await page.evaluate(() => {
      document.body.innerHTML = `
        <style>
          table { table-layout: auto; width: 100px; }
          .box { width: 50px !important; }
        </style>
        <div id="app">
          <table style="border-spacing: 0">
            <tr>
              <td style="padding: 0">
                <div style="width: 100px" class="box"></div>
              </td>
            </tr>
          </table>
        </div>
      `;
    });
    const originRect = await page.locator('table').evaluate(el => el.getBoundingClientRect());
    expect(originRect.width).toBe(100);

    const lightPrint = await loadPrintScript(page);
    await lightPrint('#app');
    const frame = getPrintContainter(page).contentFrame();

    const targetRect = await frame.locator('table').evaluate(el => el.getBoundingClientRect());
    expect(targetRect.width).toBe(100);
  });
});

test.describe('aspectRatio', () => {
  test('style: aspect-ratio', async ({ page }) => {
    await page.evaluate(() => {
      document.body.innerHTML = `
        <style>
          #ratio1 { width: 20px !important; height: 10px }
          #ratio2 { width: 20px !important; }
        </style>
        <div id="app">
          <div id="ratio1" style="aspect-ratio: 1; width: 10px;"></div>
          <div id="ratio2" style="aspect-ratio: 1; width: 10px;"></div>
        </div>
      `;
    });
    const lightPrint = await loadPrintScript(page);
    await lightPrint('#app');
    const frame = getPrintContainter(page).contentFrame();

    let targetRect = await frame.locator('#ratio1').evaluate(el => el.getBoundingClientRect());
    expect(targetRect.width).toBe(20);
    expect(targetRect.height).toBe(10);
    targetRect = await frame.locator('#ratio2').evaluate(el => el.getBoundingClientRect());
    expect(targetRect.width).toBe(20);
    expect(targetRect.height).toBe(20);
  });

  test('image with intrinsic aspect ratio', async ({ page }) => {
    // The image’s intrinsic aspect ratio: 13 / 4
    const imageBuffer = await readFile('examples/assets/light-print-black.svg');
    const dataURL = `data:image/svg+xml;base64,${imageBuffer.toString('base64')}`;

    await page.evaluate(dataURL => {
      document.body.innerHTML = `
        <style>img { display: block; width: 130px; height: 60px; } </style>
        <div id="app">
          <img src="${dataURL}" height="40" />
        </div>
      `;
    }, dataURL);
    const lightPrint = await loadPrintScript(page);
    await lightPrint('#app');
    const frame = getPrintContainter(page).contentFrame();
    const targetRect = await frame.locator('img').evaluate(el => el.getBoundingClientRect());
    expect(targetRect.width).toBe(130);
    expect(targetRect.height).toBe(60);
  });
});

test('padding/border affect size', async ({ page }) => {
  const size = 36;
  const padding = 8;
  page.evaluate(
    ({ size, padding }) => {
      document.body.innerHTML = `
        <style>
          #app { padding: 0px !important; border: 0px !important; width: ${size}px; height: ${size}px; }
        </style>
        <div id="app" style="padding: ${padding}px; border: ${padding}px solid black; display: inline-block; box-sizing: border-box;">
          <div style="width: ${size - padding * 4}px; height: ${size - padding * 4}px; box-sizing: border-box;"></div>
        </div>
      `;
    },
    { size, padding }
  );
  const lightPrint = await loadPrintScript(page);
  await lightPrint('#app');
  const frame = getPrintContainter(page).contentFrame();
  const rect = await frame.locator('#app').evaluate(el => el.getBoundingClientRect());
  expect(rect.width).toBe(size);
  expect(rect.height).toBe(size);
});
