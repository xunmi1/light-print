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
    document.body.innerHTML = /* HTML */ `<div id="app"></div>`;
  });

  test('no target', async () => {
    // @ts-expect-error
    await expect(lightPrint()).rejects.toThrow('Invalid HTML element');
  });

  test('target is a CSS selector', async () => {
    await expect(lightPrint('#not-exist')).rejects.toThrow('Invalid HTML element');
    await expect(lightPrint('#app')).resolves.toBeUndefined();
  });

  test('target is an normal element', async () => {
    await expect(lightPrint({})).rejects.toThrow('Invalid HTML element');
    const element = document.querySelector('#app')!;
    await expect(lightPrint(element)).resolves.toBeUndefined();
  });

  test('target is a body element', async () => {
    const element = document.querySelector('body')!;
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
    await expect(lightPrint('body')).rejects.toThrow();
  });
});

describe('destroy', () => {
  test('restore the original state after printing', async () => {
    document.documentElement.innerHTML = /* HTML */ ` <head></head>
      <body>
        <div id="app"></div>
      </body>`;
    const innerHTML = document.documentElement.innerHTML;
    await lightPrint('#app');
    expect(document.documentElement.innerHTML).toBe(innerHTML);
  });
});

describe('abort', () => {
  test('abort before printing', async () => {
    const promise = lightPrint('body', { signal: AbortSignal.abort() });
    await expect(promise).rejects.toThrow(Error);
    await expect(promise).rejects.toThrow(expect.objectContaining({ name: 'AbortError' }));
  });

  test('abort when printing', async () => {
    document.body.innerHTML = /* HTML */ `<img src="/examples/assets/not-found.png" style="display: block" />`;
    const abortController = new AbortController();
    const promise = lightPrint('img', { signal: abortController.signal });
    abortController.abort();
    await expect(promise).rejects.toThrow(Error);
    await expect(promise).rejects.toThrow(expect.objectContaining({ name: 'AbortError' }));
  });

  test('abort after printing is completed', async () => {
    document.body.innerHTML = /* HTML */ `<div id="app"></div>`;
    await expect(lightPrint('#app', { signal: AbortSignal.timeout(1000) })).resolves.toBeUndefined();
    document.body.innerHTML = /* HTML */ `<img src="/examples/assets/not-found.png" style="display: block" />`;
    await expect(lightPrint('img', { signal: AbortSignal.timeout(1000) })).rejects.toThrow('Failed to load resource');
  });

  test('cleanup when aborted', async () => {
    document.body.innerHTML = /* HTML */ `<img src="/examples/assets/not-found.png" style="display: block" />`;
    const innerHTML = document.body.innerHTML;
    const abortController = new AbortController();
    const promise = lightPrint('img', { signal: abortController.signal });
    abortController.abort();
    await expect(promise).rejects.toThrow(Error);
    expect(document.body.innerHTML).toBe(innerHTML);
  });
});
