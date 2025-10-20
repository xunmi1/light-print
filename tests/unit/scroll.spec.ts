import { expect, test, describe, beforeEach } from 'vitest';
import { clone } from './utils';

describe('scroll', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="app" >
        <div id="outer" style="width: 100px; height: 100px; overflow: auto">
          <div id="inner" style="width: 200px; height: 200px; overflow: auto">
            <div style="width: 300px; height: 300px"></div>
          </div>
        </div>
      </div>
    `;
  });

  test('element isn’t scrolling', async () => {
    const context = clone('#app');

    const target = context.document.querySelector('#outer')!;
    expect(target.scrollTop).toBe(0);
    expect(target.scrollLeft).toBe(0);
  });

  test('element is now scrolling', async () => {
    const outer = document.querySelector('#outer')!;
    outer.scrollTo({ top: 50, left: 60 });
    const context = clone('#app');

    let target = context.document.querySelector('#outer')!;
    expect(target.scrollTop).toBe(50);
    expect(target.scrollLeft).toBe(60);

    target = context.document.querySelector('#inner')!;
    expect(target.scrollTop).toBe(0);
    expect(target.scrollLeft).toBe(0);
  });
});
