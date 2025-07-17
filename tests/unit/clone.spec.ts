import { describe, expect, test } from 'vitest';
import { Window as HappyWindow } from 'happy-dom';

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
    expect({ ...targetStyle }).toEqual({ ...originStyle });

    originStyle = getStyle(window, '.no-inline');
    targetStyle = getStyle(newWindow, '.no-inline');
    expect({ ...targetStyle }).toEqual({ ...originStyle });
    originStyle = getStyle(window, '.has-inline');
    targetStyle = getStyle(newWindow, '.has-inline');
    expect({ ...targetStyle }).toEqual({ ...originStyle });
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
    cloneDocument(context, document.querySelector('#app')!);
    const originImg = window.document.querySelector('img')!;
    const targetImg = window.document.querySelector('img')!;
    expect(targetImg.loading).toEqual(originImg.loading);
    expect(targetImg.src).toEqual(originImg.src);

    const originInput = window.document.querySelector('input')!;
    const targetInput = window.document.querySelector('input')!;
    expect(targetInput.type).toBe(originInput.type);

    const originCanvas = window.document.querySelector('canvas')!;
    const targetCanvas = window.document.querySelector('canvas')!;
    expect(targetCanvas.width).toBe(originCanvas.width);
    expect(targetCanvas.height).toBe(originCanvas.height);

    const originDetails = window.document.querySelector('details')!;
    const targetDetails = window.document.querySelector('details')!;
    expect(targetDetails.open).toBe(originDetails.open);
  });
});

// `happy-dom` doesn't support pseudo element
// https://github.com/capricorn86/happy-dom/issues/1836
describe.todo('clone pseudo element', () => {
  test('before and after', async () => {
    document.body.innerHTML = `
      <div id="app">
        <style>
          .test::before { content: '::before'; color: red; }
          .test::after { content: 'after'; color: blue }
        </style>
        <div class="test">style</div>
      </div>
    `;

    const context = setupContext();
    const newWindow = context.window!;
    cloneDocument(context, document.querySelector('#app')!);

    expect(getStyle(newWindow, '.test', '::before')).toEqual(getStyle(window, '.test', '::before'));
    expect(getStyle(newWindow, '.test', '::after')).toEqual(getStyle(window, '.test', '::after'));
  });
});

function getStyle(contentWindow: HappyWindow | Window, selector: string, pseudoElt?: string) {
  return contentWindow.getComputedStyle((contentWindow as any).document.querySelector(selector)!, pseudoElt);
}

function setupContext() {
  const context = createContext();
  // @ts-expect-error
  context.window = new HappyWindow({ url: 'about:blank' });
  return context;
}
