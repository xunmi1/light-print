import { describe, expect, test, vi } from 'vitest';

import { createContext } from 'src/context';
import type { Document } from 'happy-dom';
import { getStyle } from './utils';

test('create context', () => {
  const context = createContext();
  expect(context).toBeDefined();

  const newWindow = new Window();
  context.bind(newWindow.document);
  expect(context.document).toBe(newWindow.document);
});

describe('getSelector', () => {
  test('selector is valid', () => {
    const context = createContext();
    context.bind(document);
    const app = document.createElement('div');
    document.body.appendChild(app);
    expect(document.querySelector(context.getSelector(app))).toBe(app);
  });

  test('doesn’t affect common attributes', () => {
    const context = createContext();
    context.bind(document);
    document.body.innerHTML = /* HTML */ `<div id="app" class="foo"></div>`;
    const app = document.querySelector('#app')!;
    context.getSelector(app);
    expect(app.id).toBe('app');
    expect(app.className).toBe('foo');
  });

  test('different elements, different selectors', () => {
    const context = createContext();
    context.bind(document);
    document.body.innerHTML = /* HTML */ `<div class="a">a</div>
      <div class="b">b</div>`;
    const selector1 = context.getSelector(document.querySelector('.a')!);
    const selector2 = context.getSelector(document.querySelector('.b')!);
    expect(selector1).not.toBe(selector2);
  });

  test('same elements, same selectors', () => {
    const context = createContext();
    context.bind(document);
    document.body.innerHTML = /* HTML */ `<div class="a">a</div>`;
    const selector1 = context.getSelector(document.querySelector('.a')!);
    const selector2 = context.getSelector(document.querySelector('.a')!);
    expect(selector1).toBe(selector2);
  });
});

describe('style', () => {
  test('must be mounted to take effect', () => {
    const context = createContext<Document>();
    context.bind(new Window().document);
    context.document.body.innerHTML = /* HTML */ `<div class="test"></div>`;

    context.appendStyle('.test { color: red; }');
    expect(getStyle(context.document, '.test').color).toBeFalsy();

    context.mountStyle();
    expect(getStyle(context.document, '.test').color).toBe('red');
  });

  test('must be appended before mounting', () => {
    const context = createContext<Document>();
    context.bind(new Window().document);
    context.document.body.innerHTML = /* HTML */ `<div class="test"></div>`;

    context.mountStyle();
    expect(getStyle(context.document, '.test').color).toBeFalsy();

    context.appendStyle('.test { color: red; }');
    context.mountStyle();
    expect(getStyle(context.document, '.test').color).toBe('red');
  });

  test('change mount location', () => {
    const context = createContext();
    context.bind(document);
    document.body.innerHTML = /* HTML */ `<div class="test"></div>`;
    context.appendStyle('.test { color: red; }');
    context.mountStyle(document.body);
    expect(getStyle(document, '.test').color).toBe('red');
  });

  test('doesn’t affect the current style', () => {
    const context = createContext();
    const newWindow = new Window();
    context.bind(newWindow.document);
    window.document.body.innerHTML = /* HTML */ `<div class="test"></div>`;

    context.appendStyle('.test { color: red; }');
    context.mountStyle();
    expect(getStyle(document, '.test').color).toBeFalsy();
  });

  test('empty styles should not be appended', () => {
    const context = createContext<Document>();
    context.bind(new Window().document);
    context.document.body.innerHTML = /* HTML */ `<div class="test"></div>`;

    context.appendStyle();
    context.mountStyle();
    expect(getStyle(context.document, '.test').color).toBeFalsy();

    context.appendStyle('.test { color: red; }');
    expect(getStyle(context.document, '.test').color).toBeFalsy();
  });

  test('repeated append', () => {
    const context = createContext();
    context.bind(document);
    context.appendStyle('body { color: red; display: flex; }');
    context.appendStyle('body { color: blue; position: absolute; }');
    context.mountStyle();
    const style = getStyle(document, 'body');
    expect(style.color).toBe('blue');
    expect(style.display).toBe('flex');
    expect(style.position).toBe('absolute');
  });

  test('repeated mount', () => {
    const context = createContext();
    context.bind(document);
    context.appendStyle('body { color: blue }');
    context.mountStyle();
    context.mountStyle();
    expect(getStyle(document, 'body').color).toBe('blue');
  });

  test('isolation', () => {
    const context1 = createContext<Document>();
    context1.bind(document);
    context1.appendStyle('body { color: red; }');
    context1.mountStyle();

    const context2 = createContext<Document>();
    context2.bind(new Window().document);
    expect(getStyle(context2.document, 'body').color).toBeFalsy();
  });
});

describe('tasks', () => {
  test('addTask', () => {
    const context = createContext<Document>();
    expect(() => context.addTask(() => {})).not.toThrow();
    expect(context.addTask(() => {})).toBeUndefined();
  });

  test('flushTasks', () => {
    const context = createContext();
    const task = vi.fn();
    context.addTask(task);
    context.flushTasks();
    expect(task).toHaveBeenCalledTimes(1);
  });

  test('flushTasks should clear the tasks', () => {
    const context = createContext();
    const task1 = vi.fn();
    context.addTask(task1);
    context.flushTasks();
    const task2 = vi.fn();
    context.addTask(task2);
    context.flushTasks();
    expect(task1).toHaveBeenCalledTimes(1);
    expect(task2).toHaveBeenCalledTimes(1);
  });
});
