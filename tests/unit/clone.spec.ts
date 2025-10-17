import { describe, expect, test } from 'vitest';
import { getStyle } from './utils';

import { cloneDocument } from 'src/clone';
import { createContext, SELECTOR_NAME, type Context } from 'src/context';
import type { ElementNameMap } from 'src/utils';

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
  context.mountStyle();

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
    <style>* { display: block }</style>
    <div id="app">
       <img src="" loading="lazy" />
       <input type="file" />
       <details open></details>
    </div>
  `;
  const context = setupContext();
  cloneDocument(context, document.querySelector('#app')!);
  let [target, origin] = querySelectors(context, 'img');
  expect(target.loading).toBe(origin.loading);
  expect(target.src).toBeFalsy();

  [target, origin] = querySelectors(context, 'input');
  expect(target.type).toBe(origin.type);

  [target, origin] = querySelectors(context, 'details');
  expect(target.open).toBe(origin.open);
});

describe('ignore', () => {
  test('non-rendering element', async () => {
    const size = 100;
    document.body.innerHTML = `
      <div id="app">
        <style>.ignore { font-size: ${size}px }</style>
        <source class="ignore" src="https://example.com/video.mp4" type="video/mp4" />
        <track class="ignore" src="https://example.com/captions.vtt" kind="captions" srclang="en" />
        <script class="ignore"></script>
        <template class="ignore"></template>
        <slot class="ignore"></slot>
        <param class="ignore"></param>
      </div>
    `;
    const context = setupContext();
    cloneDocument(context, document.querySelector('#app')!);
    expect(getStyle(context.window, 'source').fontSize).not.toBe(size);
    expect(getStyle(context.window, 'param').fontSize).not.toBe(size);
    expect(getStyle(context.window, 'script').fontSize).not.toBe(size);
    expect(getStyle(context.window, 'template').fontSize).not.toBe(size);
    expect(getStyle(context.window, 'slot').fontSize).not.toBe(size);
    expect(getStyle(context.window, 'param').fontSize).not.toBe(size);
  });

  test('hidden element', async () => {
    document.body.innerHTML = `
      <style>.hidden { display: none }</style>
      <div id="app">
        <div id="root-hidden" class="hidden"></div>
        <div>
          <div>
            <p>text</p>
            <div id="nest-hidden" class="hidden"></div>
          </div>
        </div>
      </div>
    `;
    const context = setupContext();
    cloneDocument(context, document.querySelector('#app')!);
    expect(context.document.querySelector('#app')).toBeTruthy();
    expect(context.document.querySelector('#root-hidden')).toBeFalsy();
    expect(context.document.querySelector('#nest-hidden')).toBeFalsy();
  });
});

test('clone iframe', async () => {
  document.body.innerHTML = `
      <div id="app">
        <iframe src="https://example.com/other.html" style="display: block"></iframe>
      </div>
    `;
  const context = setupContext();
  cloneDocument(context, document.querySelector('#app')!);
  const [target] = querySelectors(context, 'iframe');
  expect(target.src).toBe('https://example.com/other.html');
});

describe('clone canvas', () => {
  test('normal', async () => {
    document.body.innerHTML = `
      <div id="app">
        <!-- 'happy-dom' BUG: display is falsy -->
        <canvas width="50" height="50" style="display: block"></canvas>
      </div>
    `;

    const context = setupContext();
    cloneDocument(context, document.querySelector('#app')!);
    const [target, origin] = querySelectors(context, 'canvas');
    expect(target.width).toBe(origin.width);
    expect(target.height).toBe(origin.height);
  });

  test('zero size', async () => {
    document.body.innerHTML = `
      <div id="app" >
        <canvas id="zeroHeight" width="50" height="0" style="display: block"></canvas>
        <canvas id="zeroWidth" width="0" height="50" style="display: block"></canvas>
      </div>
    `;
    const context = setupContext();
    cloneDocument(context, document.querySelector('#app')!);
    let [target, origin] = querySelectors(context, '#zeroHeight');
    expect(target.width).toBe(origin.width);
    expect(target.height).toBe(origin.height);

    [target, origin] = querySelectors(context, '#zeroWidth');
    expect(target.width).toBe(origin.width);
    expect(target.height).toBe(origin.height);
  });
});

describe('clone media', () => {
  test('currentTime', async () => {
    document.body.innerHTML = `
      <div id="app">
        <!-- when audio has controls, display isn't 'none', but 'happy-dom' has BUG -->
        <audio src="https://example.com/audio.mp3" controls style="display: block"></audio>
        <video src="https://example.com/video.mp4" controls style="display: block"></video>
      </div>
    `;
    document.querySelector('audio')!.currentTime = 10;
    document.querySelector('video')!.currentTime = 10;
    const context = setupContext();
    cloneDocument(context, document.querySelector('#app')!);
    let [target] = querySelectors(context, 'audio');
    expect(target.currentTime).toBe(10);

    [target] = querySelectors(context, 'video');
    expect(target.currentTime).toBe(10);
  });

  test('currentSrc', async () => {
    const src = 'https://example.com/video.mp4';
    document.body.innerHTML = `
      <div id="app">
        <video id="selfSrc" src="${src}" style="display: block"></video>
        <video id="sourceSrc" style="display: block">
          <source src="${src}" type="video/mp4" />
        </video>
        <video id="emptySrc" style="display: block"></video>
      </div>
    `;
    const context = setupContext();
    cloneDocument(context, document.querySelector('#app')!);
    let [target] = querySelectors(context, '#selfSrc');
    expect(target.currentSrc).toBe(src);

    [target] = querySelectors(context, '#sourceSrc');
    expect(target.currentSrc).toBe(src);

    [target] = querySelectors(context, '#emptySrc');
    expect(target.currentSrc).toBeFalsy();
  });
});

// `happy-dom` doesn't support pseudo element
// https://github.com/capricorn86/happy-dom/issues/1836
describe('clone pseudo element', () => {
  test('before and after', async () => {
    // Due to happy-dom’s lack of pseudo-element support in getComputedStyle,
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

describe('clone form fields', () => {
  test('input', async () => {
    document.body.innerHTML = `
      <div id="app">
        <input type="text" value="foo" />
      </div>
    `;
    document.querySelector('input')!.value = 'bar';
    const context = setupContext();
    cloneDocument(context, document.querySelector('#app')!);
    expect(context.document.querySelector('input')!.value).toBe('bar');
  });

  test('radio', async () => {
    document.body.innerHTML = `
      <div id="app">
        <input type="radio" name="foo" value="bar" />
      </div>
    `;
    document.querySelector('input')!.checked = true;
    const context = setupContext();
    cloneDocument(context, document.querySelector('#app')!);
    expect(context.document.querySelector('input')!.checked).toBe(true);
  });

  test('checkbox', async () => {
    document.body.innerHTML = `
      <div id="app">
        <input type="checkbox" name="foo" value="foo">
      </div>
    `;
    const context = setupContext();
    const origin = document.querySelector('input')!;

    origin.checked = true;
    cloneDocument(context, document.querySelector('#app')!);
    let target = context.document.querySelector('input')!;
    expect(target.checked).toBe(true);
    expect(target.indeterminate).toBe(false);
    expect(target.value).toBe('foo');

    origin.indeterminate = true;
    const context1 = setupContext();
    cloneDocument(context1, document.querySelector('#app')!);
    target = context1.document.querySelector('input')!;
    expect(target.indeterminate).toBe(true);
  });

  test('select', async () => {
    document.body.innerHTML = `
      <div id="app">
        <select>
          <option value="foo">foo</option>
          <option value="bar">bar</option>
        </select>
      </div>
    `;
    document.querySelector('select')!.value = 'bar';
    const context = setupContext();
    cloneDocument(context, document.querySelector('#app')!);
    let target = context.document.querySelector('select')!;
    expect(target.value).toBe('bar');
    expect(target.selectedIndex).toBe(1);

    target = context.document.querySelector('option[value="foo"]')!;
    expect(target.selected).toBe(false);
    target = context.document.querySelector('option[value="bar"]')!;
    expect(target.selected).toBe(true);
  });

  test('textarea', async () => {
    document.body.innerHTML = `
      <div id="app">
        <textarea>foo</textarea>
      </div>
    `;
    document.querySelector('textarea')!.value = 'bar';
    const context = setupContext();
    cloneDocument(context, document.querySelector('#app')!);
    expect(context.document.querySelector('textarea')!.value).toBe('bar');
  });
});

test('scroll state', async () => {
  document.body.innerHTML = `
    <div id="app" style="height: 100px; width: 100px overflow: auto">
      <div id="foo" style="height: 200px; width: 200px"></div>
    </div>
  `;
  const origin = document.querySelector('#foo')!;
  origin.scrollTop = 10;
  origin.scrollLeft = 10;
  const context = setupContext();
  cloneDocument(context, document.querySelector('#app')!);
  const target = context.document.querySelector('#foo')!;
  expect(target.scrollTop).toBe(origin.scrollTop);
  expect(target.scrollLeft).toBe(origin.scrollLeft);
});

function setupContext() {
  const context = createContext();
  context.window = new Window();
  return context;
}

function querySelectors<T extends keyof ElementNameMap>(
  context: Context,
  selector: T
): [ElementNameMap[T], ElementNameMap[T]];
function querySelectors(context: Context, selector: string) {
  return [context.window!.document.querySelector(selector)!, window.document.querySelector(selector)!];
}
