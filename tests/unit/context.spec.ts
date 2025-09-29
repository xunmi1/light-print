import { describe, expect, test } from 'vitest';

import { createContext } from 'src/context';
import { getStyle } from './utils';

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
      <div class="a">a</div>
      <div class="b">b</div>
    `;

    const selector1 = context.getSelector(document.querySelector('.a')!);
    expect(document.querySelector('.a')).toBe(document.querySelector(selector1));
    const selector2 = context.getSelector(document.querySelector('.b')!);
    expect(selector1).not.toBe(selector2);
    const selector3 = context.getSelector(document.querySelector('.a')!);
    expect(selector1).toBe(selector3);
  });
});

describe('style', () => {
  test('mount', () => {
    const context = createContext();
    const newWindow = new Window();
    context.window = newWindow;

    newWindow.document.body.innerHTML = `<div class="test"></div>`;
    window.document.body.innerHTML = `<div class="test"></div>`;

    context.mountStyle();
    expect(getStyle(newWindow, '.test').color).toBeFalsy();

    context.appendStyle();
    context.mountStyle();
    expect(getStyle(newWindow, '.test').color).toBeFalsy();

    context.appendStyle('.test { color: red; }');
    expect(getStyle(newWindow, '.test').color).toBeFalsy();

    context.mountStyle();
    expect(getStyle(newWindow, '.test').color).toBe('red');
    // doesn't effect origin window
    expect(getStyle(window, '.test').color).toBeFalsy();
  });

  test('repeatedly append', () => {
    const context = createContext();
    context.window = window;
    context.appendStyle('body { color: red; display: flex; }');
    context.appendStyle('body { color: blue; position: absolute; }');
    context.mountStyle();
    const style = getStyle(window, 'body');
    expect(style.color).toBe('blue');
    expect(style.display).toBe('flex');
    expect(style.position).toBe('absolute');
  });

  test('isolation', () => {
    const context1 = createContext();
    context1.window = window;
    context1.appendStyle('body { color: red; }');

    const context2 = createContext();
    context2.window = new Window();
    context2.mountStyle();
    expect(getStyle(context2.window, 'body').color).toBeFalsy();
  });
});
