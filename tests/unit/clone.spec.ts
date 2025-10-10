import { describe, expect, test } from 'vitest';
import { getStyle } from './utils';

import { cloneDocument } from 'src/clone';
import { createContext, SELECTOR_NAME, type Context } from 'src/context';
import type { ElementNameMap } from 'src/utils';

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
         <details open></details>
      </div>
    `;
    const context = setupContext();
    cloneDocument(context, document.querySelector('#app')!);
    const [originImg, targetImg] = querySelectors(context, 'img');
    expect(targetImg.loading).toBe(originImg.loading);
    expect(targetImg.src).toBe('');

    const [originInput, targetInput] = querySelectors(context, 'input');
    expect(targetInput.type).toBe(originInput.type);

    const [originDetails, targetDetails] = querySelectors(context, 'details');
    expect(targetDetails.open).toBe(originDetails.open);
  });
});

describe('clone canvas', () => {
  test('normal', async () => {
    document.body.innerHTML = `
      <div id="app">
         <canvas width="50" height="50"></canvas>
      </div>
    `;

    const context = setupContext();
    cloneDocument(context, document.querySelector('#app')!);
    const [originCanvas, targetCanvas] = querySelectors(context, 'canvas');
    expect(targetCanvas.width).toBe(originCanvas.width);
    expect(targetCanvas.height).toBe(originCanvas.height);
  });

  test('zero size', async () => {
    document.body.innerHTML = `
      <div id="app">
         <canvas id="zeroHeight" width="50" height="0"></canvas>
         <canvas id="zeroWidth" width="0" height="50"></canvas>
      </div>
    `;
    const context = setupContext();
    cloneDocument(context, document.querySelector('#app')!);
    let [originCanvas, targetCanvas] = querySelectors(context, '#zeroHeight');
    expect(targetCanvas.width).toBe(originCanvas.width);
    expect(targetCanvas.height).toBe(originCanvas.height);

    [originCanvas, targetCanvas] = querySelectors(context, '#zeroWidth');
    expect(targetCanvas.width).toBe(originCanvas.width);
    expect(targetCanvas.height).toBe(originCanvas.height);
  });
});

// `happy-dom` doesn't support pseudo element
// https://github.com/capricorn86/happy-dom/issues/1836
describe('clone pseudo element', () => {
  test('before and after', async () => {
    // Due to happy-dom's lack of pseudo-element support in getComputedStyle,
    // we manually implemented it with the limitation of requiring `SELECTOR_NAME` style targeting.
    document.body.innerHTML = `
      <style>
          [${SELECTOR_NAME}="1"]::before { content: 'before'; color: red; }
          [${SELECTOR_NAME}="1"]::after { content: 'after'; color: blue; }
          [${SELECTOR_NAME}="2"]::after { color: blue; }
        </style>
      <div id="app">
        <div ${SELECTOR_NAME}="1">style</div>
        <div ${SELECTOR_NAME}="2">style</div>
      </div>
    `;

    const context = setupContext();
    const newWindow = context.window!;

    cloneDocument(context, document.querySelector('#app')!);
    context.mountStyle();

    expect(getStyle(newWindow, `[${SELECTOR_NAME}="1"]`, '::before')?.color).toBe('red');
    expect(getStyle(newWindow, `[${SELECTOR_NAME}="1"]`, '::after')?.color).toBe('blue');
    expect(getStyle(newWindow, `[${SELECTOR_NAME}="2"]`, '::after')?.color).toBeFalsy();
  });
});

function setupContext() {
  const context = createContext();
  context.window = new Window({ url: 'about:blank' });
  return context;
}

function querySelectors<T extends keyof ElementNameMap>(
  context: Context,
  selector: T
): [ElementNameMap[T], ElementNameMap[T]];
function querySelectors(context: Context, selector: string) {
  return [window.document.querySelector(selector)!, context.window!.document.querySelector(selector)!];
}
