import { describe, test, expect, vi } from 'vitest';
import { traverse } from 'src/traverse';
import { type Element, HTMLDivElement } from 'happy-dom';

describe('visitor', () => {
  test('parameters', () => {
    const origin = document.createElement('div');
    const target = origin.cloneNode(true);
    const fn = vi.fn((_: Element, __: Element) => true);
    traverse(fn, target, origin);
    expect(fn).toHaveBeenLastCalledWith(target, origin);
  });

  test('traversal order', () => {
    const origin = document.createElement('div');
    origin.id = '1';
    origin.innerHTML = /* HTML */ `
      <div id="2">
        <div id="3"></div>
        <div id="4"></div>
      </div>
      <div id="5"></div>
    `;
    const fn = vi.fn((_: Element, __: Element) => true);
    traverse(fn, origin.cloneNode(true), origin);
    expect(fn).toHaveBeenCalledTimes(5);
    const order = fn.mock.calls.map(params => params[0].id);
    expect(order).toStrictEqual(['1', '2', '3', '4', '5']);
  });
});

test('not rely on element-specific properties', () => {
  // The custom element can override `children` and `childNodes`
  class XElement extends HTMLDivElement {
    get children(): HTMLDivElement['children'] {
      throw new Error('Not allowed');
    }

    get childNodes(): HTMLDivElement['childNodes'] {
      throw new Error('Not allowed');
    }
  }
  window.customElements.define('x-element', XElement);
  const origin = document.createElement('x-element');
  origin.appendChild(document.createElement('div'));
  const fn = vi.fn(() => true);
  traverse(fn, origin.cloneNode(true), origin);
  expect(fn).toHaveBeenCalledTimes(2);
});

test('child must be element', () => {
  const origin = document.createElement('div');
  origin.append(document.createTextNode('foo'), document.createElement('div'));
  const fn = vi.fn(() => true);
  traverse(fn, origin.cloneNode(true), origin);
  expect(fn).toHaveBeenCalledTimes(2);
});

test('root can be non-element', () => {
  const origin = document.createDocumentFragment();
  origin.appendChild(document.createElement('div'));
  const fn = vi.fn(() => true);
  traverse(fn, origin.cloneNode(true), origin);
  expect(fn).toHaveBeenCalledTimes(2);
});

describe('prune', () => {
  test('root', () => {
    const body = document.createElement('body');
    const origin = document.createElement('div');
    const target = origin.cloneNode(true);
    body.append(origin, target);
    const fn = vi.fn(() => false);
    traverse(fn, target, origin);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(body.children[0]).toBe(origin);
    expect(body.children[1]).toBeFalsy();
  });

  test('leaf node', () => {
    const origin = document.createElement('div');
    const nested = document.createElement('div');
    nested.id = 'nested';
    origin.append(nested);
    const leaf = document.createElement('div');
    leaf.id = 'leaf';
    nested.append(leaf);
    const target = origin.cloneNode(true);
    const fn = vi.fn((el: Element) => el.id !== leaf.id);
    traverse(fn, target, origin);
    expect(fn).toHaveBeenCalledTimes(3);
    expect(target.querySelector('#leaf')).toBeNull();
    expect(target.querySelector('#nested')).toBeTruthy();
    expect(nested.firstElementChild).toBe(leaf);
  });

  test('intermediate node', () => {
    const origin = document.createElement('div');
    const nested = document.createElement('div');
    nested.id = 'nested';
    origin.append(nested);
    nested.append(document.createElement('div'));
    const target = origin.cloneNode(true);
    const fn = vi.fn((el: Element) => el.id !== nested.id);
    traverse(fn, target, origin);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(target.querySelector('#nested')).toBeNull();
    expect(origin.querySelector('#nested')).toBe(nested);
  });

  test('node that have siblings', () => {
    const origin = document.createElement('div');
    const middleNode = document.createElement('div');
    middleNode.id = 'middle';
    origin.append(document.createElement('div'), middleNode, document.createElement('div'));
    let target = origin.cloneNode(true);
    const fn = vi.fn((el: Element) => el.id !== middleNode.id);
    traverse(fn, target, origin);
    expect(fn).toHaveBeenCalledTimes(4);
    expect(target.childElementCount).toBe(2);
    expect(target.querySelector('#middle')).toBeNull();
    expect(origin.querySelector('#middle')).toBe(middleNode);

    middleNode.append(document.createElement('div'));
    target = origin.cloneNode(true);
    const fn1 = vi.fn((el: Element) => el.id !== middleNode.id);
    traverse(fn1, target, origin);
    expect(fn1).toHaveBeenCalledTimes(4);
    expect(target.childElementCount).toBe(2);
    expect(target.querySelector('#middle')).toBeNull();
    expect(origin.querySelector('#middle')).toBe(middleNode);
  });
});
