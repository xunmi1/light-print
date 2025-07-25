import { expect, describe, test } from 'vitest';

import lightPrint from '../../src';

describe('return value', () => {
  test('promise', () => {
    expect(lightPrint('#app').catch(() => {})).toBeInstanceOf(Promise);
  });
});

describe('print target', () => {
  test('no target', async () => {
    // @ts-expect-error
    await expect(lightPrint()).rejects.toThrowError('Invalid HTML element');
  });
  test('target is an HTML element', async () => {
    await expect(lightPrint({})).rejects.toThrowError('Invalid HTML element');
    const element = document.createElement('div');
    await expect(lightPrint(element)).resolves.toBeUndefined();
  });
  test('target is a CSS selector', async () => {
    await expect(lightPrint('#app')).rejects.toThrowError('Invalid HTML element');
    document.body.innerHTML = '<div id="app"></div>';
    await expect(lightPrint('#app')).resolves.toBeUndefined();
  });
});

describe('destroy', () => {
  test('restore the original state after printing', async () => {
    const innerHTML = '<head></head><body><div id="app"></div></body>';
    document.documentElement.innerHTML = innerHTML;
    await lightPrint('#app');
    expect(document.documentElement.innerHTML).toBe(innerHTML);
  });
});
