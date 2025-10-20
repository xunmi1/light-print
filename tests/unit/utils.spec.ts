import { describe, test, expect, vi } from 'vitest';
import { bindOnceEvent, isHidden, normalizeNode } from 'src/utils';

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
