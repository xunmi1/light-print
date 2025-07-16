import type { Page, TestInfo } from '@playwright/test';

export function delayNetwork(page: Page, ms: number) {
  return page.route('**/*', async route => setTimeout(() => route.continue(), ms));
}

export function getScreenshotPath(name: string, testInfo: TestInfo) {
  // need to be the same as `snapshotPathTemplate` config
  return `tests/browser/__screenshots__/${name}-${process.platform}-${testInfo.project.name}.png`;
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
