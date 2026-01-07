import { describe, expect, test } from 'vitest';
import { getStyle, clone } from './utils';

test('clone attributes', () => {
  document.body.innerHTML = `
    <style>* { display: block }</style>
    <div id="app">
      <img src="" width="100" height="100" />
      <input type="file" placeholder="foo" />
      <details open></details>
    </div>
  `;
  const context = clone('#app');
  expect(context.document.querySelector('img')!.width).toBe(100);
  expect(context.document.querySelector('img')!.src).toBeFalsy();

  expect(context.document.querySelector('input')!.type).toBe('file');
  expect(context.document.querySelector('input')!.placeholder).toBe('foo');

  expect(context.document.querySelector('details')!.open).toBe(true);
});

describe('hidden elements', () => {
  test('skip non-rendering element', () => {
    const size = 100;
    document.body.innerHTML = `
      <style>.ignore { font-size: ${size}px }</style>
      <div id="app">
        <source class="ignore" src="https://example.com/video.mp4" type="video/mp4" />
        <track class="ignore" src="https://example.com/captions.vtt" kind="captions" srclang="en" />
        <wbr class="ignore" />
      </div>
    `;
    const context = clone('#app');
    ['source', 'track', 'wbr'].forEach(type => {
      expect(context.document.querySelector(type)).toBeTruthy();
      expect(getStyle(context.document, type).fontSize).not.toBe(size);
    });
  });

  test('explicitly set to hidden', () => {
    document.body.innerHTML = `
      <style>.hidden { display: none }</style>
      <div id="app">
        <div id="start" class="hidden"></div>
        <div>
          <div id="hasSibling" class="hidden"></div>
          <div>
            <p>text</p>
            <div id="notSibling" class="hidden"></div>
          </div>
        </div>
      </div>
    `;
    const context = clone('#app');
    expect(context.document.querySelector('#app')).toBeTruthy();
    expect(context.document.querySelector('#start')).toBeFalsy();
    expect(context.document.querySelector('#hasSibling')).toBeFalsy();
    expect(context.document.querySelector('#notSibling')).toBeFalsy();
  });

  test('hidden by default', () => {
    document.body.innerHTML = `
      <div id="app">
        <style></style>
        <link rel="stylesheet" href="style.css">
        <link rel="preload" as="style">
        <param>
        <meta>
        <base>
        <template></template>
        <script></script>
      </div>
    `;
    const context = clone('#app');
    ['link[rel="preload"]', 'param', 'meta', 'base', 'template', 'script'].forEach(type => {
      expect(context.document.querySelector(type)).toBeFalsy();
    });
  });

  test('made visible again via styling', () => {
    document.body.innerHTML = `
      <style>.visible { display: block; height: 10px }</style>
      <div id="app">
        <link class="visible">
        <param class="visible">
        <meta class="visible">
        <base class="visible">
        <template class="visible"></template>
        <script class="visible"></script>
      </div>
    `;
    const context = clone('#app');
    ['link', 'param', 'meta', 'base', 'template', 'script'].forEach(type => {
      expect(context.document.querySelector(type)).toBeTruthy();
    });
  });
});
