import { describe, expect, test } from 'vitest';

import { createContext } from '../../src/context';

describe('context', () => {
  test('create context', () => {
    const context = createContext();
    expect(context).toBeDefined();

    const newWindow = new Window();
    context.window = newWindow;
    expect(context.document).toBe(newWindow.document);
  });

  test('getSelector', () => {
    const context = createContext();
    context.window = window;
    document.body.innerHTML = `
      <div id="app">
        <div class="a">a</div>
        <div class="b">b</div>
      </div>
    `;

    const selector1 = context.getSelector(document.querySelector('.a')!);
    const selector2 = context.getSelector(document.querySelector('.b')!);

    expect(selector1).not.toBe(selector2);

    const selector3 = context.getSelector(document.querySelector('.a')!);
    expect(selector1).toBe(selector3);
  });

  test('mountStyle', () => {
    const context = createContext();
    const newWindow = new Window();
    context.window = newWindow;

    newWindow.document.body.innerHTML = `<div class="test"></div>`;
    window.document.body.innerHTML = `<div class="test"></div>`;

    const target = newWindow.document.querySelector('.test')!;

    context.mountStyle();
    expect(newWindow.getComputedStyle(target).color).toBeFalsy();

    context.appendStyle();
    context.mountStyle();
    expect(newWindow.getComputedStyle(target).color).toBeFalsy();

    const cssText = '.test { color: red; }';
    context.appendStyle(cssText);
    expect(newWindow.getComputedStyle(target).color).toBeFalsy();

    context.mountStyle();
    const targetNode = newWindow.document.querySelector('.test');
    expect(newWindow.getComputedStyle(target).color).toBe('red');
    // doesn't effect origin window
    const origin = window.document.querySelector('.test')!;
    expect(window.getComputedStyle(origin).color).toBeFalsy();
  });
});
