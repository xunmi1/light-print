import { expect, test } from 'vitest';
import { CSSStyleSheet, Document, HTMLElement } from 'happy-dom';
import { clone } from './utils';

test('open mode', () => {
  document.body.innerHTML = `<div id="app"></div>`;
  const shadow = document.querySelector('#app')!.attachShadow({ mode: 'open' });
  const span = document.createElement('span');
  span.textContent = 'shadow DOM';
  shadow.appendChild(span);

  const context = clone('#app');
  const target = context.document.querySelector('#app')!;
  expect(target.shadowRoot).toBeTruthy();
  expect(target.shadowRoot!.querySelector('span')!.textContent).toBe(span.textContent);
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
      this.attachShadow({ mode: 'open' });
      this.shadowRoot!.innerHTML = `
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
  expect(context.window.getComputedStyle(content).color).toBe('#ccc');
});

test('adopted style sheets', () => {
  document.body.innerHTML = `<div id="app"></div>`;
  const shadow = document.querySelector('#app')!.attachShadow({ mode: 'open' });
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(':host { padding: 10px; }');
  shadow.adoptedStyleSheets.push(sheet);

  const context = clone('#app');
  const target = context.document.querySelector('#app')!;
  expect(context.window.getComputedStyle(target).padding).toBe('10px');
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
