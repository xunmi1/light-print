import { expect, describe, test, beforeEach } from 'vitest';
import { Event } from 'happy-dom';

import lightPrint from 'src';

describe('return value', () => {
  test('promise', () => {
    expect(lightPrint('#app').catch(() => {})).toBeInstanceOf(Promise);
  });
});

describe('print target', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  test('no target', async () => {
    // @ts-expect-error
    await expect(lightPrint()).rejects.toThrowError('Invalid HTML element');
  });

  test('target is a CSS selector', async () => {
    await expect(lightPrint('#not-exist')).rejects.toThrowError('Invalid HTML element');
    await expect(lightPrint('#app')).resolves.toBeUndefined();
  });

  test('target is an HTML element', async () => {
    await expect(lightPrint({})).rejects.toThrowError('Invalid HTML element');
    const element = document.querySelector('#app')!;
    await expect(lightPrint(element)).resolves.toBeUndefined();
  });

  test('disabled iframe', async () => {
    const originalAppendChild = document.body.appendChild;
    document.body.appendChild = function (node) {
      // @ts-expect-error
      if (node.localName === 'iframe') {
        node.dispatchEvent(new Event('error'));
        return node;
      }
      return originalAppendChild.call(this, node);
    };
    await expect(lightPrint('body')).rejects.toThrowError();
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
