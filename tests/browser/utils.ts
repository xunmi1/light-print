import type { Locator, Page, PageScreenshotOptions, Route, TestInfo } from '@playwright/test';

function delay(ms: number) {
  if (ms === Infinity) return Promise.withResolvers<void>().promise;
  return new Promise<void>(resolve => setTimeout(() => resolve(), ms));
}

export async function delayNetwork(page: Page, ms: number) {
  const handler = async (route: Route) => {
    await delay(ms);
    await route.continue();
  };
  await page.route('**/*', handler);
  const abort = () => page.unroute('**/*', handler);
  return abort;
}

export function round(number: number, precision = 0) {
  return Math.round(number * 10 ** precision) / 10 ** precision;
}

export function roundBox(rect: Record<string, number>, precision = 0) {
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

declare global {
  interface Window {
    lightPrint: typeof import('dist/light-print').default;
  }
}
export async function loadPrintScript(page: Page) {
  await page.addScriptTag({ path: 'dist/light-print.global.js' });
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

async function print(this: Window) {
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

  await page.exposeBinding('print', ({ frame }) => frame.evaluate(print));
}

export function getScreenshotPath(name: string, testInfo: TestInfo) {
  // need to be the same as `snapshotPathTemplate` config
  return `tests/browser/__screenshots__/${name}-${process.platform}-${testInfo.project.name}.png`;
}

const FILE_PATTERN = /^(?<name>.*?)(?:\.(?<type>[^.]+))?$/;

type ScreenshotType = PageScreenshotOptions['type'];
type FileName = `${string}.${NonNullable<ScreenshotType>}`;

export function screenshot(page: Page, target: Locator, options?: { mask?: Locator[] }): Promise<Buffer>;
export function screenshot(
  page: Page,
  target: Locator,
  options?: { fileName: FileName; testInfo: TestInfo; mask?: Locator[] }
): Promise<Buffer>;
export async function screenshot(
  page: Page,
  target: Locator,
  options?: { fileName?: FileName; testInfo?: TestInfo; mask?: Locator[] }
) {
  const { fileName, testInfo, ...rest } = options ?? {};
  const { name, type } = fileName?.match(FILE_PATTERN)?.groups ?? ({} as { name?: string; type?: string });
  const path = name ? getScreenshotPath(name, testInfo!) : undefined;

  const box = await target.boundingBox();
  // The screenshot dimensions from `element.screenshot()` are inconsistent,
  // so we're using `page.screenshot()` instead.
  // @see https://github.com/microsoft/playwright/issues/18827
  const buffer = await page.screenshot({
    path,
    clip: roundBox(box!),
    fullPage: true,
    animations: 'disabled',
    type: type?.toLowerCase() as ScreenshotType,
    maskColor: 'white',
    ...rest,
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
