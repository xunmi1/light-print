import { describe, expect, test } from 'vitest';
import { Event } from 'happy-dom';

import { waitResources } from 'src/resources';

describe('resources', () => {
  test('successfully loaded', async () => {
    document.body.innerHTML = `
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
    `;
    // `happy-dom` doesn't actually load resources.
    const result = waitResources(document);
    document
      .querySelectorAll('img, object, iframe, embed, image')
      .forEach(node => node.dispatchEvent(new Event('load')));
    document.querySelectorAll('video, audio').forEach(node => node.dispatchEvent(new Event('canplay')));
    await expect(result).resolves.toBeUndefined();
  });

  test('failed to load', async () => {
    document.body.innerHTML = `<img src="https://example.com" />`;
    const result = waitResources(document);
    const resourceNodes = document.querySelectorAll('img');
    resourceNodes.forEach(node => node.dispatchEvent(new Event('error')));
    await expect(result).rejects.toThrowError('Failed to load resource');
  });

  test('empty resource', async () => {
    document.body.innerHTML = `<img srcset="" />`;
    await expect(waitResources(document)).resolves.toBeUndefined();
  });

  test('already loaded', async () => {
    document.body.innerHTML = `<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=" />`;
    const img = document.querySelector('img')!;
    // `happy-dom` doesn't support checking whether images have loaded,
    // so mock image resource is loaded.
    Object.defineProperty(img, 'complete', { value: true });
    await expect(waitResources(document)).resolves.toBeUndefined();
  });
});
