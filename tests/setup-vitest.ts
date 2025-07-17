import { BrowserWindow, HTMLCanvasElement } from 'happy-dom';

// `happy-dom` doesn't support `window.print()`,
// mock `window.print()` api
// @ts-expect-error
BrowserWindow.prototype.print = function () {
  this.dispatchEvent(new Event('beforeprint'));
  this.dispatchEvent(new Event('afterprint'));
};

// @ts-expect-error
HTMLCanvasElement.prototype.getContext = function () {
  return {
    drawImage: () => {},
  };
};
