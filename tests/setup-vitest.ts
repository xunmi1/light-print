import { BrowserWindow } from 'happy-dom';

// `happy-dom` doesn't support `window.print()`,
// mock `window.print()` api
// @ts-expect-error
BrowserWindow.prototype.print = function () {
  this.dispatchEvent(new Event('beforeprint'));
  this.dispatchEvent(new Event('afterprint'));
};
