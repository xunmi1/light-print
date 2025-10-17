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
    // `happy-dom` doesn't actually load resources, so manually dispatch `load` and `canplay` events
    const result = waitResources(document);
    document
      .querySelectorAll('img, object, iframe, embed, image')
      .forEach(node => node.dispatchEvent(new Event('load')));
    document.querySelectorAll('video, audio').forEach(node => node.dispatchEvent(new Event('canplay')));
    await expect(result).resolves.toBeUndefined();
  });

  test('failed to load', async () => {
    document.body.innerHTML = `
      <img class="error" src="1.png" />
      <img class="success" src="2.png" />
    `;
    const result = waitResources(document);
    document.querySelector('.error')!.dispatchEvent(new Event('error'));
    document.querySelector('.success')!?.dispatchEvent(new Event('load'));
    await expect(result).rejects.toThrowError('Failed to load resource');
  });

  test('empty resource', async () => {
    document.body.innerHTML = `<img srcset="" />`;
    await expect(waitResources(document)).resolves.toBeUndefined();
  });

  test('image already loaded', async () => {
    document.body.innerHTML = `<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=" />`;
    const img = document.querySelector('img')!;
    // `happy-dom` doesn't support mocking image resource,
    Object.defineProperty(img, 'complete', { value: true });
    await expect(waitResources(document)).resolves.toBeUndefined();
  });

  test('media already have data', async () => {
    document.body.innerHTML = `<audio src="https://example.com"></audio>`;
    const audio = document.querySelector('audio')!;
    // `happy-dom` doesn't support mocking media data
    // // `2` is `HTMLMediaElement.HAVE_CURRENT_DATA`
    Object.defineProperty(audio, 'readyState', { value: 2 });
    await expect(waitResources(document)).resolves.toBeUndefined();
  });
});
