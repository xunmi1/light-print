import { describe, expect, test } from 'vitest';

import { waitResources } from '../../src/resources';

const timeout = (ms: number) => new Promise((_, reject) => window.setTimeout(() => reject('timeout'), ms));

describe('resources', () => {
  test('remote resource', async () => {
    document.body.innerHTML = `
      <div id="app">
        <img src="https://example.com" loading="lazy" />
        <img src="demo-1.png" srcset="demo-1.png 100px, demo-2.png 200px" />
        <object data="https://example.com" type="image/svg+xml"></object>
        <iframe src="https://example.com"></iframe>
        <embed src="https://example.com"></embed>
        <audio src="https://example.com"></audio>
        <video src="https://example.com"></video>
        <video width="250" height="200" muted>
          <source src="https://example.com/video.mp4" type="video/mp4" />
        </video>
        <svg viewBox="0 0 100 100">
          <image href="https://example.com"></image>
        </svg>
      </div>
    `;
    // `happy-dom` doesn't support resource loading,
    // so forcefully abort resources loading prematurely.
    await expect(Promise.race([waitResources(document), timeout(1000)])).rejects.toThrowError('timeout');
  });

  test('empty resource', async () => {
    document.body.innerHTML = `
      <div id="app">
        <img srcset="" />
      </div>
    `;
    await expect(waitResources(document)).resolves.toBeUndefined();
  });
});
