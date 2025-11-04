import { describe, test, expect, vi } from 'vitest';
import { bindOnceEvent, isHidden, normalizeNode, traverse } from 'src/utils';
import { Element, HTMLCollection, HTMLDivElement } from 'happy-dom';

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
    origin.appendChild(document.createElement('div'));
    const fn = vi.fn(() => false);
    traverse(fn, origin.cloneNode(true), origin);
    expect(fn).toBeCalledTimes(1);
  });

  test('override children', () => {
    class XElement extends HTMLDivElement {
      get children(): HTMLCollection<Element> {
        throw new Error('Not allowed');
      }
    }
    window.customElements.define('x-element', XElement);
    const origin = document.createElement('x-element');
    expect(() => traverse(() => true, origin.cloneNode(true), origin)).not.toThrowError();
  });
});
