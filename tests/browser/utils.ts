import type { Page, Route, TestInfo } from '@playwright/test';

export function getScreenshotPath(name: string, testInfo: TestInfo) {
  // need to be the same as `snapshotPathTemplate` config
  return `tests/browser/__screenshots__/${name}-${process.platform}-${testInfo.project.name}.png`;
}

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

/** @HACK prevent destroy iframe container */
export function preventDestroyContainer() {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T) {
    if ('localName' in child && child.localName === 'iframe') return child;
    return originalRemoveChild.call(this, child) as T;
  };
}

/** @HACK prevent display print dialog */
export async function preventPrintDialog(page: Page, trigger: () => Promise<void> | void) {
  // Indefinitely extend the request duration to prevent the print dialog.
  const abort = await delayNetwork(page, Infinity);
  await trigger();
  const containers = getPrintContainter(page);
  await containers.evaluateAll<void, HTMLIFrameElement>(elements =>
    elements.forEach(element => {
      const currentWindow = element.contentWindow!;
      // replace `print()`
      currentWindow.print = () => {
        currentWindow.dispatchEvent(new Event('beforeprint'));
        currentWindow.dispatchEvent(new Event('afterprint'));
      };
    })
  );
  await abort();

  return containers;
}
