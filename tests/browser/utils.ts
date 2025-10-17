import type { Locator, Page, PageScreenshotOptions, Route, TestInfo } from '@playwright/test';

export function round(number: number, precision = 0) {
  return Math.round(number * 10 ** precision) / 10 ** precision;
}

type Clip = NonNullable<PageScreenshotOptions['clip']>;
export function roundClip(rect: Clip, precision = 0) {
  return {
    x: round(rect.x, precision),
    y: round(rect.y, precision),
    width: round(rect.width, precision),
    height: round(rect.height, precision),
  };
}

export function getPrintContainter(page: Page) {
  return page.locator('body > iframe');
}

export async function loadPrintScript(page: Page) {
  await page.addScriptTag({ path: 'dist/light-print.global.js' });
  type PrintType = typeof import('dist/light-print').default;
  // @ts-expect-error
  const lightPrint: PrintType = (...params) => page.evaluate(args => window.lightPrint(...args), params);
  return lightPrint;
}

/** @HACK prevent destroy iframe container */
export async function preventDestroyContainer(page: Page) {
  function replace() {
    const replaced = '__replaced__';
    const _removeChild = Node.prototype.removeChild;

    // @ts-expect-error
    if (_removeChild[replaced]) return;
    function removeChild<T extends Node>(this: Node, child: T) {
      if (child instanceof HTMLIFrameElement) return child;
      return _removeChild.call<Node, [T], T>(this, child);
    }
    removeChild[replaced] = true;
    Node.prototype.removeChild = removeChild;
  }
  await page.addInitScript(replace);
  await page.evaluate(replace);
}

export function mockPrint(this: Window) {
  this.dispatchEvent(new Event('beforeprint'));
  this.dispatchEvent(new Event('afterprint'));
}

function getBrowserName(page: Page) {
  return page.context().browser()!.browserType().name();
}

/**
 * @HACK prevent display print dialog
 *
 * `print()` blocks the main thread, and Firefox/WebKit in CI can't close the print dialog, preventing subsequent test execution.
 */
export async function preventPrintDialog(page: Page) {
  if (getBrowserName(page) === 'chromium') return;
  await page.exposeBinding('print', ({ frame }) => frame.evaluate(mockPrint));
}

export function getScreenshotPath(name: string, testInfo: TestInfo) {
  // need to be the same as `snapshotPathTemplate` config
  return `tests/browser/__screenshots__/${name}-${process.platform}-${testInfo.project.name}.png`;
}

const FILE_PATTERN = /^(?<name>.*?)(?:\.(?<type>[^.]+))?$/;

type ScreenshotType = PageScreenshotOptions['type'];
type FileName = `${string}.${NonNullable<ScreenshotType>}`;
type Size = { width: number; height: number };

export function screenshot(target: Locator, options?: { mask?: Locator[]; size?: Size }): Promise<Buffer>;
export function screenshot(
  target: Locator,
  options?: { fileName: FileName; testInfo: TestInfo; mask?: Locator[]; size?: Size }
): Promise<Buffer>;
export async function screenshot(
  target: Locator,
  options?: { fileName?: FileName; testInfo?: TestInfo; mask?: Locator[]; size?: Size }
) {
  const { fileName, testInfo, mask = [], size } = options ?? {};
  const { name, type } = (fileName?.match(FILE_PATTERN)?.groups ?? {}) as { name?: string; type?: ScreenshotType };
  const path = name ? getScreenshotPath(name, testInfo!) : undefined;
  const roundedClip = roundClip((await target.boundingBox())!);
  const page = target.page();

  // WebKit browsers do not support certain pseudo-elements.
  const maskSelectors =
    getBrowserName(page) === 'webkit' ? ['input[placeholder]', 'input[type="file"]', 'details'] : [];
  const mergedMask = mask.concat(maskSelectors.map(v => target.locator(v)));
  // The screenshot dimensions from `element.screenshot()` are inconsistent,
  // so we're using `page.screenshot()` instead.
  // @see https://github.com/microsoft/playwright/issues/18827
  const buffer = await page.screenshot({
    path,
    clip: { ...roundedClip, ...size },
    fullPage: true,
    animations: 'disabled',
    type,
    maskColor: 'white',
    mask: mergedMask,
  });
  return buffer;
}

export function getPageErrors(page: Page) {
  const errors: Error[] = [];
  page.on('pageerror', err => errors.push(err));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(new Error(message.text()));
  });
  return errors;
}

export async function pauseMedia(page: Page) {
  await page.evaluate(() => {
    document.querySelectorAll<HTMLMediaElement>('video,audio').forEach(node => {
      node.pause();
      setTimeout(() => (node.currentTime = 0));
    });
  });
}
