import { test, expect } from '@playwright/test';
import { loadPrintScript, preventPrintDialog, preventDestroyContainer, getPrintContainter, screenshot } from './utils';

test.beforeEach(async ({ page }) => {
  await preventPrintDialog(page);
  await preventDestroyContainer(page);
});

test('open mode', async ({ page }) => {
  await page.evaluate(() => {
    document.body.innerHTML = `<div id="app"></div>`;
    const shadow = document.querySelector('#app')!.attachShadow({ mode: 'open' });
    const span = document.createElement('span');
    span.textContent = 'shadow DOM';
    shadow.appendChild(span);
  });
  const lightPrint = await loadPrintScript(page);
  await lightPrint('#app');
  const frame = getPrintContainter(page).contentFrame();
  await expect(frame.locator('span')).toHaveText('shadow DOM');
});

test('contains inputs', async ({ page }) => {
  await page.evaluate(() => {
    document.body.innerHTML = `<div id="app"></div>`;
    const shadow = document.querySelector('#app')!.attachShadow({ mode: 'open' });
    const select = document.createElement('select');
    select.innerHTML = `
      <option value="foo">foo</option>
      <option value="bar">bar</option>
    `;
    select.value = 'bar';
    shadow.appendChild(select);
  });
  const lightPrint = await loadPrintScript(page);
  await lightPrint('#app');
  const frame = getPrintContainter(page).contentFrame();
  await expect(frame.locator('select')).toHaveValue('bar');
});

test('custom element', async ({ page }) => {
  await page.evaluate(() => {
    class XElement extends HTMLElement {
      constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot!.innerHTML = `
          <style> :host { display: block } .content { color: rgb(204, 204, 204); }</style>
          <div class="content"><slot></slot></div>
        `;
        this.id = 'custom';
      }
    }
    window.customElements.define('x-element', XElement);

    document.body.innerHTML = `
      <div id="app">
        <x-element>test</x-element>
      </div>
    `;
  });
  const lightPrint = await loadPrintScript(page);
  await lightPrint('#app');
  const frame = getPrintContainter(page).contentFrame();
  await expect(frame.locator('x-element')).toHaveId('custom');
  const color = await frame.locator('.content').evaluate(el => getComputedStyle(el).color);
  expect(color).toBe('rgb(204, 204, 204)');
});

test('shadow elements within shadow elements', async ({ page }) => {
  await page.evaluate(() => {
    document.body.innerHTML = `<div id="app"></div>`;
    const internal = document.createElement('div');
    internal.id = 'internal';
    internal.attachShadow({ mode: 'open' }).appendChild(document.createElement('span'));
    document.querySelector('#app')!.attachShadow({ mode: 'open' }).appendChild(internal);
  });

  const lightPrint = await loadPrintScript(page);
  await lightPrint('#app');
  const frame = getPrintContainter(page).contentFrame();
  await expect(frame.locator('#internal')).toBeAttached();
  await expect(frame.locator('#internal').locator('span')).toBeAttached();
});

test('nested shadow elements', async ({ page }) => {
  await page.evaluate(() => {
    document.body.innerHTML = `<div id="app"></div>`;
    document.querySelector('#app')!.attachShadow({ mode: 'open' }).appendChild(document.createElement('slot'));
    const nested = document.createElement('div');
    nested.id = 'nested';
    nested.attachShadow({ mode: 'open' }).appendChild(document.createElement('span'));
    document.querySelector('#app')!.appendChild(nested);
  });

  const lightPrint = await loadPrintScript(page);
  await lightPrint('#app');
  const frame = getPrintContainter(page).contentFrame();
  await expect(frame.locator('#nested')).toBeAttached();
  await expect(frame.locator('#nested').locator('span')).toBeAttached();
});
