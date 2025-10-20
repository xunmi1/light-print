import { beforeEach, describe, expect, test } from 'vitest';
import { clone } from './utils';

test('iframe', async () => {
  document.body.innerHTML = `
      <div id="app">
        <iframe src="https://example.com/other.html" style="display: block"></iframe>
      </div>
    `;
  const context = clone('#app');
  const target = context.document.querySelector('iframe');
  expect(target.src).toBe('https://example.com/other.html');
});

describe('canvas', () => {
  test('normal', async () => {
    document.body.innerHTML = `
      <div id="app">
        <!-- 'happy-dom' BUG: display is falsy -->
        <canvas width="50" height="60" style="display: block"></canvas>
      </div>
    `;

    const context = clone('#app');
    const target = context.document.querySelector('canvas');
    expect(target.width).toBe(50);
    expect(target.height).toBe(60);
  });

  test('zero size', async () => {
    document.body.innerHTML = `
      <div id="app" >
        <canvas id="zeroHeight" width="50" height="0" style="display: block"></canvas>
        <canvas id="zeroWidth" width="0" height="50" style="display: block"></canvas>
      </div>
    `;
    const context = clone('#app');
    let target = context.document.querySelector('#zeroHeight');
    expect(target.width).toBe(50);
    expect(target.height).toBe(0);

    target = context.document.querySelector('#zeroWidth');
    expect(target.width).toBe(0);
    expect(target.height).toBe(50);
  });
});

describe('media', () => {
  test('currentTime', async () => {
    document.body.innerHTML = `
      <div id="app">
        <!-- when audio has controls, display isn't 'none', but 'happy-dom' has BUG -->
        <audio src="https://example.com/audio.mp3" controls style="display: block"></audio>
        <video src="https://example.com/video.mp4" controls style="display: block"></video>
      </div>
    `;
    document.querySelector('audio')!.currentTime = 10;
    document.querySelector('video')!.currentTime = 10;
    const context = clone('#app');
    let target = context.document.querySelector('audio')!;
    expect(target.currentTime).toBe(10);

    target = context.document.querySelector('video')!;
    expect(target.currentTime).toBe(10);
  });

  test('currentSrc', async () => {
    const src = 'https://example.com/video.mp4';
    document.body.innerHTML = `
      <div id="app">
        <video id="selfSrc" src="${src}" style="display: block"></video>
        <video id="sourceSrc" style="display: block">
          <source src="${src}" type="video/mp4" />
        </video>
        <video id="emptySrc" style="display: block"></video>
      </div>
    `;
    const context = clone('#app');
    let target = context.document.querySelector('#selfSrc');
    expect(target.currentSrc).toBe(src);

    target = context.document.querySelector('#sourceSrc');
    expect(target.currentSrc).toBe(src);

    target = context.document.querySelector('#emptySrc');
    expect(target.currentSrc).toBeFalsy();
  });
});

describe('form fields', () => {
  test('input', async () => {
    document.body.innerHTML = `
      <div id="app">
        <input type="text" value="foo" />
      </div>
    `;
    document.querySelector('input')!.value = 'bar';
    const context = clone('#app');
    expect(context.document.querySelector('input')!.value).toBe('bar');
  });

  test('radio', async () => {
    document.body.innerHTML = `
      <div id="app">
        <input type="radio" name="foo" value="bar" />
      </div>
    `;
    document.querySelector('input')!.checked = true;
    const context = clone('#app');
    expect(context.document.querySelector('input')!.checked).toBe(true);
  });

  describe('checkbox', async () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div id="app">
          <input type="checkbox" name="foo" value="foo">
        </div>
      `;
    });

    test('checked', async () => {
      document.querySelector('input')!.checked = true;
      const context = clone('#app');
      expect(context.document.querySelector('input')!.checked).toBe(true);
    });

    test('indeterminate', async () => {
      document.querySelector('input')!.indeterminate = true;
      const context = clone('#app');
      expect(context.document.querySelector('input')!.indeterminate).toBe(true);
    });
  });

  describe('select', async () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div id="app">
          <select>
            <option value="foo">foo</option>
            <option value="bar">bar</option>
          </select>
        </div>
      `;
      document.querySelector('select')!.value = 'bar';
    });

    test('selectedIndex & value', async () => {
      const context = clone('#app');
      let target = context.document.querySelector('select')!;
      expect(target.value).toBe('bar');
      expect(target.selectedIndex).toBe(1);
    });

    test('selected', async () => {
      const context = clone('#app');
      let target = context.document.querySelector('option[value="foo"]')!;
      expect(target.selected).toBe(false);
      target = context.document.querySelector('option[value="bar"]')!;
      expect(target.selected).toBe(true);
    });
  });

  test('textarea', async () => {
    document.body.innerHTML = `
      <div id="app">
        <textarea>foo</textarea>
      </div>
    `;
    document.querySelector('textarea')!.value = 'bar';
    const context = clone('#app');
    expect(context.document.querySelector('textarea')!.value).toBe('bar');
  });
});
