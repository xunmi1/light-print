import { expect, test } from 'vitest';
import { CSSStyleSheet, HTMLElement } from 'happy-dom';
import DOMTokenList from 'happy-dom/lib/dom/DOMTokenList';
import * as PropertySymbol from 'happy-dom/lib/PropertySymbol';

import { clone } from './utils';

test('open mode', () => {
  document.body.innerHTML = `<div id="app"></div>`;
  const shadow = document.querySelector('#app')!.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style> #foo { color: rgb(2, 2, 2) !important; }</style>
    <div id="foo" style="color: rgb(1, 1, 1)"></div>
  `;

  const context = clone('#app');
  const shadowRoot = context.document.querySelector('#app')!.shadowRoot!;
  expect(shadowRoot).toBeTruthy();
  const target = shadowRoot.querySelector('#foo')!;
  expect(window.getComputedStyle(target).color).toBe('rgb(2, 2, 2)');
});

test('closed mode', () => {
  document.body.innerHTML = `<div id="app"></div>`;
  document.querySelector('#app')!.attachShadow({ mode: 'closed' });

  const context = clone('#app');
  const target = context.document.querySelector('#app')!;
  expect(target.shadowRoot).toBeFalsy();
});

test('contains inputs', () => {
  document.body.innerHTML = `<div id="app"></div>`;
  const shadow = document.querySelector('#app')!.attachShadow({ mode: 'open' });
  const select = document.createElement('select');
  select.innerHTML = `
    <option value="foo">foo</option>
    <option value="bar">bar</option>
  `;
  select.value = 'bar';
  shadow.appendChild(select);

  const context = clone('#app');
  const target = context.document.querySelector('#app')!;
  expect(target.shadowRoot!.querySelector('select')!.value).toBe(select.value);
});

test('custom element', () => {
  class XElement extends HTMLElement {
    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.innerHTML = `
        <style> :host { display: block } .content { color: #ccc; }</style>
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
  const context = clone('#app');
  const target = context.document.querySelector('x-element')!;
  expect(target.id).toBe('custom');
  const content = target.shadowRoot!.querySelector('.content')!;
  expect(content).toBeTruthy();
  expect(window.getComputedStyle(content).color).toBe('#ccc');
});

test('adopted style sheets', () => {
  document.body.innerHTML = `<div id="app"></div>`;
  const shadow = document.querySelector('#app')!.attachShadow({ mode: 'open' });
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(':host { padding: 10px; }');
  shadow.adoptedStyleSheets.push(sheet);

  const context = clone('#app');
  const target = context.document.querySelector('#app')!;
  expect(window.getComputedStyle(target).padding).toBe('10px');
});

test('shadow root is clonable', () => {
  document.body.innerHTML = `<div id="app"></div>`;
  const shadow = document.querySelector('#app')!.attachShadow({ mode: 'open', clonable: true });
  const span = document.createElement('span');
  shadow.appendChild(span);

  const context = clone('#app');
  const target = context.document.querySelector('#app')!;
  expect(target.shadowRoot!.querySelectorAll('span')).toHaveLength(1);
});

test('shadow elements within shadow elements', () => {
  document.body.innerHTML = `<div id="app"></div>`;
  const internal = document.createElement('div');
  internal.id = 'internal';
  internal.attachShadow({ mode: 'open' }).appendChild(document.createElement('span'));
  document.querySelector('#app')!.attachShadow({ mode: 'open' }).appendChild(internal);

  const context = clone('#app');
  const target = context.document.querySelector('#app')!;
  const clonedInternal = target.shadowRoot!.querySelector('#internal')!;
  expect(clonedInternal).toBeTruthy();
  expect(clonedInternal.shadowRoot!.querySelectorAll('span')).toBeTruthy();
});

test('nested shadow elements', () => {
  document.body.innerHTML = `<div id="app"></div>`;
  document.querySelector('#app')!.attachShadow({ mode: 'open' }).appendChild(document.createElement('slot'));
  const nested = document.createElement('div');
  nested.id = 'nested';
  nested.attachShadow({ mode: 'open' }).appendChild(document.createElement('span'));
  document.querySelector('#app')!.appendChild(nested);

  const context = clone('#app');
  const clonedNested = context.document.querySelector('#nested')!;
  expect(clonedNested).toBeTruthy();
  expect(clonedNested.shadowRoot!.querySelector('span')).toBeTruthy();
});

declare module 'happy-dom' {
  interface Element {
    part: DOMTokenList;
  }
}

test('part attribute', () => {
  document.body.innerHTML = `
    <style> ::part(foo) { color: red; }</style>
    <div id="app"></div>
  `;
  const shadow = document.querySelector('#app')!.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <div id="foo" style="display: block"></div>
    <div style="display: none"></div>
  `;
  shadow.querySelectorAll('*').forEach((el, i) => {
    // `happy-dom` doesn't support `part` attribute
    el.part = new DOMTokenList(PropertySymbol.illegalConstructor, el, 'part');
    el.part.add(`part-${i}`);
  });

  const context = clone('#app');
  const shadowRoot = context.document.querySelector('#app')!.shadowRoot!;
  expect(shadowRoot.querySelectorAll('div')).toHaveLength(1);
  // can't finish the test, because `part` attribute is not supported
  // expect(window.getComputedStyle(shadowRoot.querySelector('#foo')!).color).toBe('red');
});
