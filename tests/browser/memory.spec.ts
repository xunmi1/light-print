import { test, expect, type CDPSession, type Page } from '@playwright/test';
import { loadPrintScript, preventPrintDialog } from './utils';

test.beforeEach(async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium');
  await preventPrintDialog(page);
  await page.evaluate(() => {
    const app = document.createElement('div');
    app.id = 'app';
    for (let i = 0; i < 50; i++) app.appendChild(document.createElement('div'));
    document.body.appendChild(app);
  });
});

test('detect heap leak', async ({ page }) => {
  const KB = 1024;
  await using cdpSession = await createCDPSession(page);
  const lightPrint = await loadPrintScript(page);
  await collectGarbage(page, cdpSession);
  const initialHeapSize = await getPerformanceMetric(cdpSession, 'JSHeapUsedSize');

  await lightPrint('#app');
  await collectGarbage(page, cdpSession);
  const onceHeapSize = await getPerformanceMetric(cdpSession, 'JSHeapUsedSize');
  expect(onceHeapSize - initialHeapSize).toBeLessThan(200 * KB);

  await Promise.all(Array.from({ length: 10 }, () => lightPrint('#app')));
  await collectGarbage(page, cdpSession);
  const finalHeapSize = await getPerformanceMetric(cdpSession, 'JSHeapUsedSize');
  expect(finalHeapSize - onceHeapSize).toBeLessThan(100 * KB);
  expect(getGrowthRatio(finalHeapSize, onceHeapSize)).toBeLessThan(0.06);
});

test('detect element leak', async ({ page }) => {
  await using cdpSession = await createCDPSession(page);
  const lightPrint = await loadPrintScript(page);
  const initialSize = await getObjectSize(cdpSession, 'HTMLDivElement');

  await Promise.all(Array.from({ length: 10 }, () => lightPrint('#app')));
  const finalSize = await getObjectSize(cdpSession, 'HTMLDivElement');
  expect(finalSize).toBe(initialSize);
});

async function createCDPSession(page: Page) {
  const cdpSession = (await page.context().newCDPSession(page)) as CDPSession & AsyncDisposable;
  cdpSession[Symbol.asyncDispose] ??= function () {
    return this.detach();
  };
  await cdpSession.send('Performance.enable');
  await cdpSession.send('HeapProfiler.enable');
  return cdpSession;
}

async function getPerformanceMetric(cdpSession: CDPSession, metricName: string) {
  const { metrics } = await cdpSession.send('Performance.getMetrics');
  return metrics.find(v => v.name === metricName)!.value;
}

async function getObjectSize(cdpSession: CDPSession, objectName: string) {
  const { result: prototypeResult } = await cdpSession.send('Runtime.evaluate', {
    expression: `${objectName}.prototype`,
    returnByValue: false,
  });
  const { objects } = await cdpSession.send('Runtime.queryObjects', { prototypeObjectId: prototypeResult.objectId! });
  // get `queryObjects()` result size
  const { result } = await cdpSession.send('Runtime.callFunctionOn', {
    objectId: objects.objectId,
    functionDeclaration: 'function() { return this.length; }',
    returnByValue: true,
  });
  await cdpSession.send('Runtime.releaseObject', { objectId: objects.objectId! });

  return result.value as number;
}

async function collectGarbage(page: Page, cdpSession: CDPSession, timedout: number = 1000) {
  await cdpSession.send('HeapProfiler.collectGarbage');
  await page.waitForTimeout(timedout);
}

function getGrowthRatio(current: number, base: number) {
  return (current - base) / base;
}
