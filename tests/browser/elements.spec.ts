import { test, expect } from '@playwright/test';
import { loadPrintScript, preventPrintDialog, preventDestroyContainer, getPrintContainter, screenshot } from './utils';

test.beforeEach(async ({ page }) => {
  await preventPrintDialog(page);
  await preventDestroyContainer(page);
});

test.describe('canvas', () => {
  test('2d', async ({ page }, testInfo) => {
    await page.evaluate(() => {
      document.body.innerHTML = `<canvas width="120" height="50"></canvas>`;
      const ctx = document.querySelector('canvas')!.getContext('2d')!;
      ctx.font = '2rem system-ui';
      ctx.fillStyle = 'black';
      ctx.fillText('canvas', 0, 25);
    });
    const lightPrint = await loadPrintScript(page);
    await lightPrint('canvas');

    const container = getPrintContainter(page);
    await container.evaluate(element => (element.style = 'width: 200px; height: 100px'));
    await screenshot(page, page.locator('canvas'), { fileName: 'canvas-2d.png', testInfo });
    const buffer = await screenshot(page, container.contentFrame().locator('canvas'));
    expect(buffer).toMatchSnapshot('canvas-2d.png');
  });

  test('webgl', async ({ page, browserName }, testInfo) => {
    const headless = testInfo.project.use.headless ?? true;
    // @see https://bugzilla.mozilla.org/show_bug.cgi?id=1375585
    test.skip(browserName === 'firefox' && headless, 'Firefox does not support WebGL in headless mode');
    await page.evaluate(() => {
      document.body.innerHTML = `<canvas width="50" height="50"></canvas>`;
      const gl = document.querySelector('canvas')!.getContext('webgl2', { preserveDrawingBuffer: true })!;
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.clearColor(1, 0, 1, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    });
    const lightPrint = await loadPrintScript(page);
    await lightPrint('canvas');

    const container = getPrintContainter(page);
    await container.evaluate(element => (element.style = 'width: 100px; height: 100px'));
    await screenshot(page, page.locator('canvas'), { fileName: 'canvas-webgl.png', testInfo });
    const buffer = await screenshot(page, container.contentFrame().locator('canvas'));
    expect(buffer).toMatchSnapshot('canvas-webgl.png');
  });

  test('zero size', async ({ page }) => {
    await page.evaluate(() => {
      document.body.innerHTML = `
      <div id="app">
         <canvas width="50" height="0"></canvas>
         <canvas width="0" height="50"></canvas>
         <canvas width="50" height="50" style="display: none"></canvas>
      </div>
    `;
    });
    const lightPrint = await loadPrintScript(page);
    await expect(lightPrint('#app')).resolves.toBeUndefined();
  });
});
