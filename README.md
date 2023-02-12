# light-print

[![ci](https://img.shields.io/github/actions/workflow/status/xunmi1/light-print/ci.yml?style=flat-square&logo=github)](https://github.com/xunmi1/light-print/actions/workflows/ci.yml)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/light-print?style=flat-square)](https://www.npmjs.com/package/light-print)
[![npm](https://img.shields.io/npm/v/light-print?style=flat-square)](https://www.npmjs.com/package/light-print)
[![NPM](https://img.shields.io/npm/l/light-print?style=flat-square)](https://www.npmjs.com/package/light-print)

A lightweight print tool for the browser.

### Install

- NPM

  ```bash
  npm install --save light-print
  # or
  yarn add light-print
  ```

- CDN

  ```html
  <script src="https://cdn.jsdelivr.net/npm/light-print@1/dist/light-print.umd.min.js"></script>
  ```

### Usage

```js
import lightPrint from 'light-print';

lightPrint(target, { documentTitle, mediaPrintStyle, zoom });
```

### Types

```ts
interface PrintOptions {
  // document title
  documentTitle?: string;
  // additional print style when printing
  mediaPrintStyle?: string;
  // page zoom
  zoom?: number | string;
}

// returns a Promise object that is fulfilled when exiting the print window.
// Note: didn't judge whether it has been printed.
type lightPrint = <T extends string | Node>(containerOrSelector: T, options?: Partial<Options>) => Promise<void>;
```
