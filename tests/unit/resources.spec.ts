import { describe, expect, test } from 'vitest';
import { Event } from 'happy-dom';

import { waitForResources } from 'src/resources';

describe('normal resources', () => {
  test('successfully loaded', async () => {
    document.body.innerHTML = /* HTML */ `
      <img src="/assets/light-print-black.svg" loading="lazy" />
      <object data="/assets/light-print-black.svg" type="image/svg+xml"></object>
      <iframe src="/nest.html"></iframe>
      <embed src="/assets/light-print-black.svg" type="image/svg+xml" />
      <audio src="/assets/video.mp4"></audio>
      <video src="/assets/video.mp4"></video>
      <video width="250" height="200" muted>
        <source src="/assets/video.mp4" type="video/mp4" />
      </video>
      <svg viewBox="0 0 100 100">
        <image href="/assets/light-print-black.svg"></image>
      </svg>
    `;

    const result = waitForResources(document);
    // `happy-dom` doesn't actually load resources, so manually dispatch `load` and `canplay` events
    document.querySelectorAll('object, embed, image').forEach(node => node.dispatchEvent(new Event('load')));
    document.querySelectorAll('video, audio').forEach(node => node.dispatchEvent(new Event('canplay')));
    await expect(result).resolves.toBeUndefined();
  });

  test('failed to load', async () => {
    document.body.innerHTML = /* HTML */ `
      <img class="error" src="/assets/not-found.png" />
      <img class="success" src="/assets/light-print-black.svg" />
    `;
    const result = waitForResources(document);
    await expect(result).rejects.toThrow('Failed to load resource');
  });

  test('empty resource', async () => {
    document.body.innerHTML = /* HTML */ `<img srcset="" />`;
    await expect(waitForResources(document)).resolves.toBeUndefined();
  });

  test('image already loaded', async () => {
    document.body.innerHTML = /* HTML */ `<img
      src="data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="
    />`;
    await expect(waitForResources(document)).resolves.toBeUndefined();
  });

  test('media already have data', async () => {
    document.body.innerHTML = /* HTML */ `<audio src="https://example.com"></audio>`;
    const audio = document.querySelector('audio')!;
    // `happy-dom` doesn't support mocking media data
    // // `2` is `HTMLMediaElement.HAVE_CURRENT_DATA`
    Object.defineProperty(audio, 'readyState', { value: 2 });
    await expect(waitForResources(document)).resolves.toBeUndefined();
  });
});

describe('ignore link[ref="stylesheet"]', () => {
  test('ignore whether it has loaded', async () => {
    document.body.innerHTML = /* HTML */ `
      <link rel="stylesheet" href="/assets/index.css" />
      <link rel="stylesheet" href="/assets/index.css" media="all" />
      <link rel="preload" as="style" href="/assets/index.css" />
    `;
    const result = waitForResources(document);
    document.querySelectorAll('link').forEach(node => node.dispatchEvent(new Event('error')));
    await expect(result).resolves.toBeUndefined();
  });
});
