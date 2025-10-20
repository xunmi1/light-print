import { describe, expect, test } from 'vitest';
import { getStyle, clone } from './utils';

import { SELECTOR_NAME } from 'src/context';

// `happy-dom` doesn't support pseudo element.
// https://github.com/capricorn86/happy-dom/issues/1836
// Due to `happy-dom`’s lack of pseudo-element support in getComputedStyle,
// we manually implemented it with the limitation of requiring `SELECTOR_NAME` style targeting.

describe.each([{ type: '::before' }, { type: '::after' }])('$type', ({ type }) => {
  test('"content" is required', () => {
    document.body.innerHTML = `
      <style>
        [${SELECTOR_NAME}="1"]${type} { content: 'before'; color: red; }
      </style>
      <div id="app">
        <div ${SELECTOR_NAME}="1"></div>
      </div>
    `;
    const context = clone('#app');
    expect(getStyle(context.window!, `[${SELECTOR_NAME}="1"]`, type)?.color).toBe('red');
  });

  test('no "content"', () => {
    document.body.innerHTML = `
      <style>
        [${SELECTOR_NAME}="1"]${type} { color: red; }
      </style>
      <div id="app">
        <div ${SELECTOR_NAME}="1"></div>
      </div>
    `;
    const context = clone('#app');
    expect(getStyle(context.window!, `[${SELECTOR_NAME}="1"]`, type)?.color).toBeFalsy();
  });
});

test('::after', async () => {
  // Due to `happy-dom`’s lack of pseudo-element support in getComputedStyle,
  // we manually implemented it with the limitation of requiring `SELECTOR_NAME` style targeting.
  document.body.innerHTML = `
    <style>
      [${SELECTOR_NAME}="1"]::after { color: red; }
      [${SELECTOR_NAME}="2"]::after { content: 'before'; color: red; }
    </style>
    <div id="app">
      <div ${SELECTOR_NAME}="1"></div>
      <div ${SELECTOR_NAME}="2"></div>
    </div>
  `;
  const context = clone('#app');
  const newWindow = context.window!;
  expect(getStyle(newWindow, `[${SELECTOR_NAME}="1"]`, '::after')?.color).toBeFalsy();
  expect(getStyle(newWindow, `[${SELECTOR_NAME}="2"]`, '::after')?.color).toBe('red');
});

const PSEUDO_ELECTORS = [
  '::before',
  '::after',
  '::marker',
  '::first-letter',
  '::first-line',
  '::placeholder',
  '::file-selector-button',
  '::details-content',
] as const;

describe('::marker', () => {
  test('element’s display should be "list-item"', () => {
    document.body.innerHTML = `
      <style>
        [${SELECTOR_NAME}="1"]::marker { color: red; }
      </style>
      <div id="app">
        <div ${SELECTOR_NAME}="1" style="display: list-item"></div>
      </div>
    `;
    const context = clone('#app');
    expect(getStyle(context.window!, `[${SELECTOR_NAME}="1"]`, '::marker')?.color).toBe('red');
  });

  test('element’s display is not "list-item"', () => {
    document.body.innerHTML = `
      <style>
        [${SELECTOR_NAME}="1"]::marker { color: red; }
      </style>
      <div id="app">
        <div ${SELECTOR_NAME}="1"></div>
      </div>
    `;

    const context = clone('#app');
    expect(getStyle(context.window!, `[${SELECTOR_NAME}="1"]`, '::marker')?.color).toBeFalsy();
  });
});

describe.each([{ type: '::first-letter' }, { type: '::first-line' }])('$type', ({ type }) => {
  test('element’s inside display should be "block"', () => {
    const displays = ['block', 'inline-block', 'list-item', 'flow-root', 'table-caption', 'table-cell'];

    document.body.innerHTML = `
      <style>
        ${displays.map((_, i) => `[${SELECTOR_NAME}="${i + 1}"]${type} { color: red; }`).join('')}
      </style>
      <div id="app">
        ${displays.map((display, i) => `<div ${SELECTOR_NAME}="${i + 1}" style="display: ${display}"></div>`).join('')}
      </div>
    `;
    const context = clone('#app');
    displays.forEach((_, i) => {
      const selector = `[${SELECTOR_NAME}="${i + 1}"]`;
      expect(getStyle(context.window!, selector, type)?.color).toBe('red');
    });
  });

  test('element’s outside display is not "block"', () => {
    document.body.innerHTML = `
      <style>
        [${SELECTOR_NAME}="1"]${type} { color: red; }
      </style>
      <div id="app">
        <div ${SELECTOR_NAME}="1" style="display: inline"></div>
      </div>
    `;
    const context = clone('#app');
    expect(getStyle(context.window!, `[${SELECTOR_NAME}="1"]`, type)?.color).toBeFalsy();
  });
});

describe('::placeholder', () => {
  test('input && textarea', () => {
    document.body.innerHTML = `
      <style>
        [${SELECTOR_NAME}="1"]::placeholder { color: red; }
        [${SELECTOR_NAME}="2"]::placeholder { color: blue; }
      </style>
      <div id="app">
        <input ${SELECTOR_NAME}="1" placeholder="foo" />
        <textarea ${SELECTOR_NAME}="2" placeholder="foo"></textarea>
      </div>
    `;
    const context = clone('#app');
    expect(getStyle(context.window!, `[${SELECTOR_NAME}="1"]`, '::placeholder')?.color).toBe('red');
    expect(getStyle(context.window!, `[${SELECTOR_NAME}="2"]`, '::placeholder')?.color).toBe('blue');
  });

  test('no placeholder', () => {
    document.body.innerHTML = `
      <style>
        [${SELECTOR_NAME}="1"]::placeholder { color: red; }
      </style>
      <div id="app">
        <input ${SELECTOR_NAME}="1" />
      </div>
    `;
    const context = clone('#app');
    expect(getStyle(context.window!, `[${SELECTOR_NAME}="1"]`, '::placeholder')?.color).toBeFalsy();
  });

  test('neither input nor textarea', () => {
    document.body.innerHTML = `
      <style>
        [${SELECTOR_NAME}="1"]::placeholder { color: red; }
      </style>
      <div id="app">
        <div ${SELECTOR_NAME}="1"></div>
      </div>
    `;
    const context = clone('#app');
    expect(getStyle(context.window!, `[${SELECTOR_NAME}="1"]`, '::placeholder')?.color).toBeFalsy();
  });
});

describe('::file-selector-button', () => {
  test('input type="file"', () => {
    document.body.innerHTML = `
      <style>
        [${SELECTOR_NAME}="1"]::file-selector-button { color: red; }
      </style>
      <div id="app">
        <input type="file" ${SELECTOR_NAME}="1" />
      </div>
    `;
    const context = clone('#app');
    expect(getStyle(context.window!, `[${SELECTOR_NAME}="1"]`, '::file-selector-button')?.color).toBe('red');
  });

  test('input’s type is not "file"', () => {
    document.body.innerHTML = `
      <style>
        [${SELECTOR_NAME}="1"]::file-selector-button { color: red; }
      </style>
      <div id="app">
        <input ${SELECTOR_NAME}="1" type="text" />
      </div>
    `;
    const context = clone('#app');
    expect(getStyle(context.window!, `[${SELECTOR_NAME}="1"]`, '::file-selector-button')?.color).toBeFalsy();
  });

  test('no input element', () => {
    document.body.innerHTML = `
      <style>
        [${SELECTOR_NAME}="1"]::file-selector-button { color: red; }
      </style>
      <div id="app">
        <div ${SELECTOR_NAME}="1"></div>
      </div>
    `;
    const context = clone('#app');
    expect(getStyle(context.window!, `[${SELECTOR_NAME}="1"]`, '::file-selector-button')?.color).toBeFalsy();
  });
});

describe('::details-content', () => {
  test('details', () => {
    document.body.innerHTML = `
      <style>
        [${SELECTOR_NAME}="1"]::details-content { color: red; }
      </style>
      <div id="app">
        <details ${SELECTOR_NAME}="1">
          <summary>foo</summary>
        </details>
      </div>
    `;
    const context = clone('#app');
    expect(getStyle(context.window!, `[${SELECTOR_NAME}="1"]`, '::details-content')?.color).toBe('red');
  });

  test('no details element', () => {
    document.body.innerHTML = `
      <style>
        [${SELECTOR_NAME}="1"]::details-content { color: red; }
      </style>
      <div id="app">
        <div ${SELECTOR_NAME}="1"></div>
      </div>
    `;
    const context = clone('#app');
    expect(getStyle(context.window!, `[${SELECTOR_NAME}="1"]`, '::details-content')?.color).toBeFalsy();
  });
});
