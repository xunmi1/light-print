import { describe, expect, test } from 'vitest';
import { getStyle, clone } from './utils';

describe('clone style', () => {
  test('basic', async () => {
    document.body.innerHTML = `
      <style>.test { color: white; display: flex; }</style>
      <div id="app">
        <style>.test { background: blue }</style>
        <div class="only-inline" style="height: 10rem">style</div>
        <div class="no-inline test">style</div>
        <div class="has-inline test" style="color: red; font-size: 2rem">style</div>
      </div>
    `;
    const context = clone('#app');
    const newWindow = context.window!;

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

  test('non-inline style !important', async () => {
    document.body.innerHTML = `
      <style>#app { color: blue !important }</style>
      <div id="app" style="color: red"></div>
    `;
    const context = clone('#app');
    expect(getStyle(context.window, '#app').color).toBe('blue');
  });

  test('inline style !important', async () => {
    document.body.innerHTML = `
      <style>#app { color: blue }</style>
      <div id="app" style="color: red !important"></div>
    `;
    const context = clone('#app');
    expect(getStyle(context.window, '#app').color).toBe('red');
  });

  // Accurate testing is impossible in a mock environment; precise validation happens in E2E tests.
  test('table width', async () => {
    document.body.innerHTML = `
      <style>table { table-layout: fixed; width: 20px }</style>
      <div id="app" style="width: 100px">
        <table>
          <tr>
            <td class="test">light-print</td>
          </tr>
        </table>
      </div>
    `;
    const context = clone('#app');
    const targetStyle = getStyle(context.window, 'table');
    expect(targetStyle.width).toBe('20px');
  });
});

test('clone attributes', async () => {
  document.body.innerHTML = `
    <style>* { display: block }</style>
    <div id="app">
      <img src="" width="100" height="100" />
      <input type="file" placeholder="foo" />
      <details open></details>
    </div>
  `;
  const context = clone('#app');
  let target = context.document.querySelector('img');
  expect(target.width).toBe(100);
  expect(target.src).toBeFalsy();

  target = context.document.querySelector('input');
  expect(target.type).toBe('file');
  expect(target.placeholder).toBe('foo');

  target = context.document.querySelector('details');
  expect(target.open).toBe(true);
});

describe('ignore', () => {
  test('non-rendering element', async () => {
    const size = 100;
    document.body.innerHTML = `
      <style>.ignore { font-size: ${size}px }</style>
      <div id="app">
        <source class="ignore" src="https://example.com/video.mp4" type="video/mp4" />
        <track class="ignore" src="https://example.com/captions.vtt" kind="captions" srclang="en" />
        <param class="ignore" />
        <meta class="ignore" />
        <link class="ignore" />
        <base class="ignore" />
        <wbr class="ignore" />
      </div>
    `;
    const context = clone('#app');
    ['source', 'track', 'param', 'link', 'meta', 'base', 'wbr'].forEach(type => {
      expect(getStyle(context.window, type).fontSize).not.toBe(size);
    });
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
    const context = clone('#app');
    expect(context.document.querySelector('#app')).toBeTruthy();
    expect(context.document.querySelector('#root-hidden')).toBeFalsy();
    expect(context.document.querySelector('#nest-hidden')).toBeFalsy();
  });
});
