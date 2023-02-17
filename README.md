# light-print

[![ci](https://img.shields.io/github/actions/workflow/status/xunmi1/light-print/ci.yml?style=flat-square&logo=github)](https://github.com/xunmi1/light-print/actions/workflows/ci.yml)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/light-print?style=flat-square)](https://www.npmjs.com/package/light-print)
[![npm](https://img.shields.io/npm/v/light-print?style=flat-square)](https://www.npmjs.com/package/light-print)
[![license](https://img.shields.io/npm/l/light-print?style=flat-square)](https://www.npmjs.com/package/light-print)

A lightweight print tool for the browser.

### Install

```bash
npm install --save light-print
# or
yarn add light-print
# or
pnpm add light-print
```

### Usage

Print container elements and their descendants.

```js
import lightPrint from 'light-print';

lightPrint('#id').then(() => {
  // do something when exiting the print window.
});
```

- The argument can either be a CSS selector or an actual DOM element.
- Returns a Promise when exiting the print window.

### Types

```ts
interface PrintOptions {
  /** document title */
  documentTitle?: string;
  /** additional print style when printing */
  mediaPrintStyle?: string;
  /** page zoom */
  zoom?: number | string;
}

function lightPrint(containerOrSelector: Element | string, options?: PrintOptions): Promise<void>;
```
