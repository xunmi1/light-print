import { describe, expect, test } from 'vitest';
import { getStyle, clone } from './utils';

describe('inline & external style', () => {
  test('basic', () => {
    document.body.innerHTML = `
      <style>.test { color: white; display: flex; }</style>
      <div id="app">
        <style>.test { padding: 8px }</style>
        <div class="only-inline" style="height: 10rem">style</div>
        <div class="no-inline test">style</div>
        <div class="has-inline test" style="color: red; font-size: 2rem">style</div>
      </div>
    `;
    const context = clone('#app');

    let originStyle = getStyle(document, '.only-inline');
    let targetStyle = getStyle(context.document, '.only-inline');
    expect(targetStyle).toEqual(originStyle);

    originStyle = getStyle(document, '.no-inline');
    targetStyle = getStyle(context.document, '.no-inline');
    expect(targetStyle).toEqual(originStyle);

    originStyle = getStyle(document, '.has-inline');
    targetStyle = getStyle(context.document, '.has-inline');
    expect(targetStyle).toEqual(originStyle);
  });

  test('external style !important', () => {
    document.body.innerHTML = `
      <style>#app { color: blue !important }</style>
      <div id="app" style="color: red"></div>
    `;
    const context = clone('#app');
    expect(getStyle(context.document, '#app').color).toBe('blue');
  });

  test('inline style !important', () => {
    document.body.innerHTML = `
      <style>#app { color: blue }</style>
      <div id="app" style="color: red !important"></div>
    `;
    const context = clone('#app');
    expect(getStyle(context.document, '#app').color).toBe('red');
  });
});

describe('style position', () => {
  test('outside', () => {
    document.body.innerHTML = `
      <style>.test { color: red }</style>
      <div id="app">
        <div class="test">style</div>
      </div>
      <style>.test { background: red }</style>
    `;
    const context = clone('#app');
    const targetStyle = getStyle(context.document, '.test');
    expect(targetStyle.color).toBe('red');
    expect(targetStyle.background).toBe('red');
  });

  test('inside', () => {
    document.body.innerHTML = `
      <div id="app">
        <style>.test { color: red }</style>
        <div class="test">style</div>
        <style>.test { background: red }</style>
      </div>
    `;
    const context = clone('#app');
    const targetStyle = getStyle(context.document, '.test');
    expect(targetStyle.color).toBe('red');
    expect(targetStyle.background).toBe('red');
  });
});

// Accurate testing is impossible in a mock environment; precise validation happens in E2E tests.
test('table width', () => {
  document.body.innerHTML = `
    <style>table { table-layout: fixed; width: 20px }</style>
    <div id="app" style="width: 100px">
      <table>
        <tr><td class="test">light-print</td></tr>
      </table>
    </div>
  `;
  const context = clone('#app');
  const targetStyle = getStyle(context.document, 'table');
  expect(targetStyle.width).toBe('20px');
});

// Accurate testing is impossible in a mock environment; precise validation happens in E2E tests.
test('style: aspect-ratio', () => {
  document.body.innerHTML = `
    <style>
      #ratio1 { width: 20px !important; height: 10px }
      #ratio2 { width: 20px !important }
    </style>
    <div id="app">
      <div id="ratio1" style="aspect-ratio: 1; width: 10px;"></div>
      <div id="ratio2" style="aspect-ratio: 1; width: 10px;"></div>
    </div>
  `;
  const context = clone('#app');
  let targetStyle = getStyle(context.document, '#ratio1');
  expect(targetStyle.width).toBe('20px');
  // `happy-dom` does not support auto-sizing, so the height is still `10px`
  expect(targetStyle.height).toBe('10px');
  targetStyle = getStyle(context.document, '#ratio2');
  expect(targetStyle.width).toBe('20px');
  // the height should be `20px`, unable to test in `happy-dom`
  // expect(targetStyle.height).toBe('20px');
});

describe('effect box size', () => {
  test('padding', () => {
    const size = 36;
    const padding = 8;
    document.body.innerHTML = `
      <style>
        #app { padding: 0px !important; width: ${size}px; height: ${size}px; }
      </style>
      <div id="app" style="padding: ${padding}px; display: inline-block; box-sizing: border-box;">
        <div style="width: ${size - padding * 2}px; height: ${size - padding * 2}px; box-sizing: border-box;"></div>
      </div>
    `;

    const context = clone('#app');
    const targetStyle = getStyle(context.document, '#app');
    expect(targetStyle.width).toBe(`${size}px`);
    expect(targetStyle.height).toBe(`${size}px`);
  });

  test('border-width', () => {
    const size = 36;
    const borderWidth = 8;
    document.body.innerHTML = `
      <style>
        #app { border: none !important; width: ${size}px; height: ${size}px; }
      </style>
      <div id="app" style="border: ${borderWidth}px solid black; display: inline-block; box-sizing: border-box;">
        <div style="width: ${size - borderWidth * 2}px; height: ${size - borderWidth * 2}px; box-sizing: border-box;"></div>
      </div>
    `;

    const context = clone('#app');
    const targetStyle = getStyle(context.document, '#app');
    expect(targetStyle.width).toBe(`${size}px`);
    expect(targetStyle.height).toBe(`${size}px`);
  });
});

test('CSS counters', () => {
  document.body.innerHTML = `
    <style>
      #app {
        list-style-type: none;
        counter-reset: x;
      }
      #app li::before {
        content: counter(x) ': ';
        counter-increment: x;
      }
      .set {
        counter-set: x 10;
      }
      .increment {
        counter-increment: x 20;
      }
    </style>
    <ol id="app">
      <li>1</li>
      <li class="set">11</li>
      <li class="increment">32</li>
    </ol>
  `;
  const context = clone('#app');
  expect(getStyle(context.document, '#app').counterReset).toBe('x');
  expect(getStyle(context.document, '.set').counterSet).toBe('x 10');
  expect(getStyle(context.document, '.increment').counterIncrement).toBe('x 20');
});

test('border-width', () => {
  document.body.innerHTML = `
    <style> #app { border: 0px solid red; }</style>
    <div id="app">
      <button>default border</button>
    </div>
  `;
  const context = clone('#app');
  expect(getStyle(context.document, '#app').borderWidth).toBe('0px');
  expect(getStyle(context.document, 'button').borderWidth).not.toBe('0px');
});
