# light-print

[![ci](https://img.shields.io/github/actions/workflow/status/xunmi1/light-print/ci.yml?style=flat-square&logo=github)](https://github.com/xunmi1/light-print/actions/workflows/ci.yml)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/light-print?style=flat-square)](https://www.npmjs.com/package/light-print)
[![npm](https://img.shields.io/npm/v/light-print?style=flat-square)](https://www.npmjs.com/package/light-print)
[![license](https://img.shields.io/npm/l/light-print?style=flat-square)](https://www.npmjs.com/package/light-print)

A lightweight print tool for the browser.

Here is an online **[Usage Example](./test/index.html)**.

### Install

```bash
npm install --save light-print
# or
yarn add light-print
# or
pnpm add light-print
```

CDN

```html
<script src="https://cdn.jsdelivr.net/npm/light-print@2"></script>
```

If the browser does not support Promise (e.g. IE browser), then a global Promise polyfill is needed.

### Usage

Print container elements and their descendants.

```js
import lightPrint from 'light-print';

lightPrint('#id', { mediaPrintStyle: `@page { size: A4 portrait }` }).then(() => {
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

### Notes

- Does not support resources introduced in styles, such as `background-image: url(...)`.
