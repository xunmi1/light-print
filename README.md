# light-print

[![ci](https://img.shields.io/github/actions/workflow/status/xunmi1/light-print/ci.yml?style=flat-square&logo=github)](https://github.com/xunmi1/light-print/actions/workflows/ci.yml)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/light-print?style=flat-square)](https://www.npmjs.com/package/light-print)
[![npm](https://img.shields.io/npm/v/light-print?style=flat-square)](https://www.npmjs.com/package/light-print)
[![license](https://img.shields.io/npm/l/light-print?style=flat-square)](https://www.npmjs.com/package/light-print)

🖨️ Lightweight HTML element printing for browsers.

🚀 Here is an online [**usage example**](https://xunmi1.github.io/light-print/test/index.html).

## Install

```bash
npm i light-print
# or
yarn add light-print
# or
pnpm add light-print
```

CDN

```html
<script src="https://cdn.jsdelivr.net/npm/light-print@2"></script>
```

If the browser does not support Promise (e.g. IE browser), then a global polyfill is needed.

## Usage

Print container elements and their descendants.

After the browser displays the print dialog:

- Select any printer to proceed with printing.
- Select the "Save as PDF" option to generate a PDF file.

```js
import lightPrint from 'light-print';

lightPrint('#id', { mediaPrintStyle: '@page { size: A4 portrait }' }).then(() => {
  // do something when exiting the print dialog.
});
```

- The argument can either be a CSS selector or an actual DOM element.
- Returns a Promise when exiting the print window.

### Usage in Vue

```vue
<script setup>
import { useTemplateRef } from 'vue';
import lightPrint from 'light-print';
// Prior to Vue v3.5, we could declare a `ref` matching the name of the template's ref attribute value.
const targetRef = useTemplateRef('target');

async function print() {
  await lightPrint(targetRef.value);
}
</script>

<template>
  <div ref="target">
    <!-- some nodes -->
  </div>
</template>
```

### Usage in React

```jsx
import { useRef } from 'react';
import lightPrint from 'light-print';

function MyComponent() {
  const targetRef = useRef(null);

  async function print() {
    await lightPrint(targetRef.current);
  }

  return <div ref={targetRef}>{/* some nodes */}</div>;
}
```

In other frameworks/libraries, a similar approach can be adopted for usage.

## Types

```ts
interface PrintOptions {
  /** The title of the document. */
  documentTitle?: string;
  /** The additional style of the document. */
  mediaPrintStyle?: string;
  /** The zoom of the document. */
  zoom?: number | string;
}

function lightPrint(containerOrSelector: Element | string, options?: PrintOptions): Promise<void>;
```

## FAQ

1. Is this compatible with React/Vue/Angular?

   Works with all frameworks! See our [framework examples](#usage-in-vue).

2. How to handle page breaks?

   Use CSS page break properties, e.g.

   ```css
   .page-break {
     page-break-after: always;
     break-after: page;
   }
   ```

3. How to handle headers and footers?

   In the `mediaPrintStyle` parameter, either configure its [page media](https://developer.chrome.com/blog/print-margins), or set page margins to zero and manually implement the DOM structure for headers and footers.

## Limitations

- The following resources referenced in styles are not supported, such as `background-image: url(...)`. they can be replaced with `<img src="..." />` tag.
- To specify fixed dimensions (width and height) for element container is recommended, as they cannot adapt to page dimensions when printing.
- Automatic font loading is not supported for non-Chromium browsers; `@font-face` can be declared within the mediaPrintStyle parameter, e.g.
  ```js
  const mediaPrintStyle = `
    @font-face {
      font-family: 'PrintFont';
      src: url('print-font.woff2') format('woff2');
    }
  `;
  ```
