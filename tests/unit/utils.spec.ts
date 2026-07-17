import { describe, test, expect, vi } from 'vitest';
import { bindOnceEvent, isDisplayed, normalizeNode } from 'src/utils';

test('normalizeNode', () => {
  const element = document.createElement('div');
  expect(normalizeNode(element)).toBe(element);

  expect(normalizeNode('body')).toBe(document.body);
  expect(normalizeNode('#not-exist')).toBeNullable();
});

describe('bindOnceEvent', () => {
  test('once', () => {
    const fn = vi.fn();
    bindOnceEvent(document.body, 'click', fn);
    document.body.click();
    expect(fn).toHaveBeenCalledTimes(1);
    document.body.click();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('event throw error', () => {
    const fn = vi.fn(() => {
      throw new Error('error');
    });
    bindOnceEvent(document.body, 'click', fn);
    try {
      document.body.click();
    } catch {}
    expect(fn).toHaveBeenCalledTimes(1);
    try {
      document.body.click();
    } catch {}
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('isDisplayed', () => {
  test('unconnected element', () => {
    const element = document.createElement('div');
    expect(isDisplayed(element.style)).toBe(false);
  });

  test('connected element', () => {
    const element = document.createElement('div');
    document.body.appendChild(element);
    element.style.display = 'none';
    expect(isDisplayed(element.style)).toBe(false);
    element.style.display = 'block';
    expect(isDisplayed(element.style)).toBe(true);
  });
});
