import { describe, expect, test, vi } from 'vitest';

import { createContext } from 'src/context';
import { getStyle } from './utils';

test('create context', () => {
  const context = createContext();
  expect(context).toBeDefined();

  const newWindow = new Window();
  context.bind(newWindow.document);
  expect(context.document).toBe(newWindow.document);
});

test('getSelector', () => {
  const context = createContext();
  context.bind(document);
  document.body.innerHTML = `<div class="a">a</div><div class="b">b</div>`;

  const selector1 = context.getSelector(document.querySelector('.a')!);
  expect(document.querySelector('.a')).toBe(document.querySelector(selector1));
  const selector2 = context.getSelector(document.querySelector('.b')!);
  expect(selector1).not.toBe(selector2);
  const selector3 = context.getSelector(document.querySelector('.a')!);
  expect(selector1).toBe(selector3);
});

describe('style', () => {
  test('must be mounted to take effect', () => {
    const context = createContext();
    context.bind(new Window().document);
    context.document.body.innerHTML = `<div class="test"></div>`;

    context.appendStyle('.test { color: red; }');
    expect(getStyle(context.document, '.test').color).toBeFalsy();

    context.mountStyle();
    expect(getStyle(context.document, '.test').color).toBe('red');
  });

  test('must be appended before mounting', () => {
    const context = createContext();
    context.bind(new Window().document);
    context.document.body.innerHTML = `<div class="test"></div>`;

    context.mountStyle();
    expect(getStyle(context.document, '.test').color).toBeFalsy();

    context.appendStyle('.test { color: red; }');
    context.mountStyle();
    expect(getStyle(context.document, '.test').color).toBe('red');
  });

  test('doesn’t affect the current window', () => {
    const context = createContext();
    const newWindow = new Window();
    context.bind(newWindow.document);
    window.document.body.innerHTML = `<div class="test"></div>`;

    context.appendStyle('.test { color: red; }');
    context.mountStyle();
    expect(getStyle(document, '.test').color).toBeFalsy();
  });

  test('empty styles should not be appended', () => {
    const context = createContext();
    context.bind(new Window().document);
    context.document.body.innerHTML = `<div class="test"></div>`;

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
    const context1 = createContext();
    context1.bind(document);
    context1.appendStyle('body { color: red; }');
    context1.mountStyle();

    const context2 = createContext();
    context2.bind(new Window().document);
    expect(getStyle(context2.document, 'body').color).toBeFalsy();
  });
});

describe('tasks', () => {
  test('addTask', () => {
    const context = createContext();
    expect(() => context.addTask(() => {})).not.toThrowError();
    expect(context.addTask(() => {})).toBeUndefined();
  });

  test('flushTasks', () => {
    const context = createContext();
    const task = vi.fn();
    context.addTask(task);
    context.flushTasks();
    expect(task).toBeCalledTimes(1);
  });

  test('flushTasks should clear the tasks', () => {
    const context = createContext();
    const task1 = vi.fn();
    context.addTask(task1);
    context.flushTasks();
    const task2 = vi.fn();
    context.addTask(task2);
    context.flushTasks();
    expect(task1).toBeCalledTimes(1);
    expect(task2).toBeCalledTimes(1);
  });
});
