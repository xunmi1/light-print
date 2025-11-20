import { describe, test, expect, vi } from 'vitest';
import { bindOnceEvent, isHidden, normalizeNode, traverse } from 'src/utils';
import { type Element, HTMLDivElement } from 'happy-dom';

test('normalizeNode', () => {
  const element = document.createElement('div');
  expect(normalizeNode(element)).toBe(element);

  expect(normalizeNode('body')).toBe(document.body);
  expect(normalizeNode('#not-exist')).toBeUndefined();
});

test('bindOnceEvent', () => {
  const fn = vi.fn();
  bindOnceEvent(document.body, 'click', fn);
  document.body.click();
  expect(fn).toBeCalledTimes(1);
  document.body.click();
  expect(fn).toBeCalledTimes(1);
});

describe('isHidden', () => {
  test('unconnected element', () => {
    const element = document.createElement('div');
    expect(isHidden(element.style)).toBe(true);
    element.style.display = 'none';
    expect(isHidden(element.style)).toBe(true);
  });

  test('connected element', () => {
    const element = document.createElement('div');
    document.body.appendChild(element);
    element.style.display = 'none';
    expect(isHidden(element.style)).toBe(true);
    element.style.display = 'block';
    expect(isHidden(element.style)).toBe(false);
  });
});

describe('traverse', () => {
  test('visitor', () => {
    const origin = document.createElement('div');
    origin.appendChild(document.createElement('div')).appendChild(document.createElement('div'));
    const fn = vi.fn(() => true);
    traverse(fn, origin.cloneNode(true), origin);
    expect(fn).toBeCalledTimes(3);
  });

  test('prune children', () => {
    const origin = document.createElement('div');
    const nested = document.createElement('div');
    origin.appendChild(nested).appendChild(document.createElement('div'));
    nested.id = 'nested';
    const target = origin.cloneNode(true);
    const fn = vi.fn((target: Element) => target.id !== 'nested');
    traverse(fn, target, origin);
    expect(fn).toBeCalledTimes(2);
    expect(target.querySelector('#nested')).toBeNull();
    expect(origin.querySelector('#nested')).toBe(nested);
  });

  test('override children attribute', () => {
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
    expect(fn).toBeCalledTimes(2);
  });

  test('children must be element', () => {
    const origin = document.createElement('div');
    origin.append(document.createTextNode('foo'), document.createElement('div'));
    const fn = vi.fn(() => true);
    traverse(fn, origin.cloneNode(true), origin);
    expect(fn).toBeCalledTimes(2);
  });

  test('root can be non-element', () => {
    const origin = document.createDocumentFragment();
    origin.appendChild(document.createElement('div'));
    const fn = vi.fn(() => true);
    traverse(fn, origin.cloneNode(true), origin);
    expect(fn).toBeCalledTimes(2);
  });
});
