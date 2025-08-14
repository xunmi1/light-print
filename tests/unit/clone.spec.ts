import { describe, expect, test } from 'vitest';
import { getStyle } from './utils';

import { cloneDocument } from '../../src/clone';
import { createContext } from '../../src/context';

describe('clone element', () => {
  test('clone style', async () => {
    document.body.innerHTML = `
      <style>.test { color: white; display: flex; }</style>
      <div id="app">
        <style>.test { background: blue }</style>
        <div class="only-inline" style="height: 10rem">style</div>
        <div class="no-inline test">style</div>
        <div class="has-inline test" style="color: red; font-size: 2rem">style</div>
      </div>
    `;
    const context = setupContext();
    const newWindow = context.window!;
    cloneDocument(context, document.querySelector('#app')!);

    let originStyle = getStyle(window, '.only-inline');
    let targetStyle = getStyle(newWindow, '.only-inline');
    expect(targetStyle).toEqual(originStyle);

    originStyle = getStyle(window, '.no-inline');
    targetStyle = getStyle(newWindow, '.no-inline');
    expect(targetStyle).toEqual(originStyle);

    originStyle = getStyle(window, '.has-inline');
    targetStyle = getStyle(newWindow, '.has-inline');
    expect(targetStyle).toEqual(originStyle);
  });

  test('clone attributes', async () => {
    document.body.innerHTML = `
      <div id="app">
         <img src="" loading="lazy" />
         <input type="file" />
         <canvas width="50" height="50"></canvas>
         <details open></details>
      </div>
    `;
    const context = setupContext();
    const newWindow = context.window!;
    cloneDocument(context, document.querySelector('#app')!);
    const originImg = window.document.querySelector('img')!;
    const targetImg = newWindow.document.querySelector('img')!;
    expect(targetImg.loading).toBe(originImg.loading);
    expect(targetImg.src).toBe('');

    const originInput = window.document.querySelector('input')!;
    const targetInput = newWindow.document.querySelector('input')!;
    expect(targetInput.type).toBe(originInput.type);

    const originCanvas = window.document.querySelector('canvas')!;
    const targetCanvas = newWindow.document.querySelector('canvas')!;
    expect(targetCanvas.width).toBe(originCanvas.width);
    expect(targetCanvas.height).toBe(originCanvas.height);

    const originDetails = window.document.querySelector('details')!;
    const targetDetails = newWindow.document.querySelector('details')!;
    expect(targetDetails.open).toBe(originDetails.open);
  });
});

// `happy-dom` doesn't support pseudo element
// https://github.com/capricorn86/happy-dom/issues/1836
describe('clone pseudo element', () => {
  test('before and after', async () => {
    // Due to happy-dom's lack of pseudo-element support in getComputedStyle,
    // we manually implemented it with the limitation of requiring `data-print-id` style targeting.
    document.body.innerHTML = `
      <style>
          [data-print-id="1"]::before { content: 'before'; color: red; }
          [data-print-id="1"]::after { content: 'after'; color: blue; }
          [data-print-id="2"]::after { color: blue; }
        </style>
      <div id="app">
        <div data-print-id="1">style</div>
        <div data-print-id="2">style</div>
      </div>
    `;

    const context = setupContext();
    const newWindow = context.window!;

    cloneDocument(context, document.querySelector('#app')!);
    context.mountStyle();

    expect(getStyle(newWindow, '[data-print-id="1"]', '::before')?.color).toBe('red');
    expect(getStyle(newWindow, '[data-print-id="1"]', '::after')?.color).toBe('blue');
    expect(getStyle(newWindow, '[data-print-id="2"]', '::after')?.color).toBeFalsy();
  });
});

function setupContext() {
  const context = createContext();
  context.window = new Window({ url: 'about:blank' });
  return context;
}
