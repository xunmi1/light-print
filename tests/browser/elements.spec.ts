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
    await screenshot(page.locator('canvas'), { fileName: 'canvas-2d.png', testInfo });
    const buffer = await screenshot(container.contentFrame().locator('canvas'));
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
    await screenshot(page.locator('canvas'), { fileName: 'canvas-webgl.png', testInfo });
    const buffer = await screenshot(container.contentFrame().locator('canvas'));
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

test.describe('svg', () => {
  test('size with viewBox', async ({ page }) => {
    await page.evaluate(() => {
      document.body.innerHTML = `
        <style>svg { display: block; width: 48px; height: 24px }</style>
        <div id="app" style="width: 24px">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>
          </svg>
        </div>
      `;
    });
    const lightPrint = await loadPrintScript(page);
    await lightPrint('#app');
    const frame = getPrintContainter(page).contentFrame();
    const svg = frame.locator('svg');
    await expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    const rect = await svg.evaluate(el => el.getBoundingClientRect());
    expect(rect.width).toBe(48);
    expect(rect.height).toBe(24);
  });

  test('size without viewBox', async ({ page }) => {
    await page.evaluate(() => {
      document.body.innerHTML = `
        <style>svg { display: block; width: 48px; height: 56px }</style>
        <div id="app">
          <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>
          </svg>
        </div>
      `;
    });
    const lightPrint = await loadPrintScript(page);
    await lightPrint('#app');
    const frame = getPrintContainter(page).contentFrame();
    const rect = await frame.locator('svg').evaluate(el => el.getBoundingClientRect());
    expect(rect.width).toBe(48);
    expect(rect.height).toBe(56);
  });
});

test.describe('form fields', () => {
  test('input', async ({ page }) => {
    await page.evaluate(() => {
      document.body.innerHTML = `
        <div id="app">
          <input type="text" value="foo" />
          <input type="radio" />
          <input type="checkbox" />
        </div>
      `;
      document.querySelector<HTMLInputElement>('input[type="text"]')!.value = 'bar';
      document.querySelector<HTMLInputElement>('input[type="radio"]')!.checked = true;
      const checkbox = document.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
      checkbox.checked = true;
      checkbox.indeterminate = true;
    });
    const lightPrint = await loadPrintScript(page);
    await lightPrint('#app');
    const frame = getPrintContainter(page).contentFrame();

    await Promise.all([
      expect(frame.locator('input[type="text"]')).toHaveValue('bar'),
      expect(frame.locator('input[type="radio"]')).toBeChecked(),
      expect(frame.locator('input[type="checkbox"]')).toBeChecked(),
      expect(frame.locator('input[type="checkbox"]')).toBeChecked({ indeterminate: true }),
    ]);
  });

  test('select & option', async ({ page }) => {
    await page.evaluate(() => {
      document.body.innerHTML = `
        <select>
          <option value="foo">foo</option>
          <option value="bar">bar</option>
        </select>
      `;
      document.querySelector('select')!.value = 'bar';
    });

    const lightPrint = await loadPrintScript(page);
    await lightPrint('select');
    const frame = getPrintContainter(page).contentFrame();
    await expect(frame.locator('select')).toHaveValue('bar');

    const option = frame.locator('option[value="bar"]');
    const selected = await option.evaluate<boolean, HTMLOptionElement>(el => el.selected);
    expect(selected).toBe(true);
  });

  test('textarea', async ({ page }) => {
    await page.evaluate(() => {
      document.body.innerHTML = `<textarea>foo</textarea>`;
      document.querySelector('textarea')!.value = 'bar';
    });
    const lightPrint = await loadPrintScript(page);
    await lightPrint('textarea');
    const frame = getPrintContainter(page).contentFrame();
    await expect(frame.locator('textarea')).toHaveValue('bar');
  });
});

test.describe('media', () => {
  test('video', async ({ page, browserName }, testInfo) => {
    test.skip(browserName === 'webkit', 'WebKit browser video tests are flaky');
    await page.goto('/examples/nest.html');
    await page.evaluate(() => {
      document.body.innerHTML = `
        <style>video { display: block; width: 240px; height: 80px; } </style>
        <div id="app">
          <video src="./assets/video.mp4" muted></video>
        </div>
      `;
    });
    const lightPrint = await loadPrintScript(page);
    await lightPrint('#app');

    const container = getPrintContainter(page);
    await container.evaluate(element => (element.style = 'width: 300px; height: 100px'));
    await screenshot(page.locator('video'), { fileName: 'video-time.png', testInfo });
    const buffer = await screenshot(container.contentFrame().locator('video'));
    expect(buffer).toMatchSnapshot('video-time.png');
  });
});

test('scroll state', async ({ page }) => {
  await page.evaluate(() => {
    document.body.innerHTML = `
      <div id="app" >
        <div id="outer" style="width: 100px; height: 100px; overflow: auto">
          <div id="inner" style="width: 200px; height: 200px; overflow: auto">
            <div style="width: 300px; height: 300px"></div>
          </div>
        </div>
      </div>
    `;
    const outer = document.querySelector('#outer')!;
    outer.scrollTo({ top: 50, left: 60, behavior: 'instant' });
  });
  const lightPrint = await loadPrintScript(page);
  await lightPrint('#app');
  const frame = getPrintContainter(page).contentFrame();
  let scrollState = await frame.locator('#outer').evaluate(el => ({ top: el.scrollTop, left: el.scrollLeft }));
  expect(scrollState).toEqual({ top: 50, left: 60 });
  scrollState = await frame.locator('#inner').evaluate(el => ({ top: el.scrollTop, left: el.scrollLeft }));
  expect(scrollState).toEqual({ top: 0, left: 0 });
});
