import { test, expect, type Locator } from '@playwright/test';
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
