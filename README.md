# light-print

[![ci](https://img.shields.io/github/actions/workflow/status/xunmi1/light-print/ci.yml?style=flat-square&logo=github)](https://github.com/xunmi1/light-print/actions/workflows/ci.yml)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/light-print?style=flat-square)](https://www.npmjs.com/package/light-print)
[![npm](https://img.shields.io/npm/v/light-print?style=flat-square)](https://www.npmjs.com/package/light-print)
[![license](https://img.shields.io/npm/l/light-print?style=flat-square)](https://www.npmjs.com/package/light-print)

🖨️ Lightweight HTML element printing for browsers.

🚀 View an online [**usage example**](https://xunmi1.github.io/light-print/examples/index.html).

- **Lightweight**: Zero Dependencies & 2KB minzipped
- **Auto-Styled**: Preserves the existing styles without extra CSS setup
- **Callback-Free**: Native promise handling for print workflows

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
<!-- After importing, `window.lightPrint` is globally available. -->
<script src="https://cdn.jsdelivr.net/npm/light-print@2"></script>
```

If the browser doesn't support Promise (e.g., Internet Explorer), a global polyfill is required.

## Usage

Print container elements and their descendants.

After the browser displays the print dialog:

- Select any printer to print
- Select the "Save as PDF" option to generate a PDF file.

```js
import lightPrint from 'light-print';

lightPrint('#id', {
  // Modify different aspects of printed pages.
  mediaPrintStyle: '@page { size: A4 portrait }',
}).then(() => {
  // Executes when the print dialog closes.
});
```

- Accepts either a CSS selector or an actual element.
- Returns a Promise that resolves when the print dialog closes.

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

The same approach works with other frameworks/libraries.

## Types

```ts
interface PrintOptions {
  /** Document title */
  documentTitle?: string;
  /** Additional print styles */
  mediaPrintStyle?: string;
  /** Document zoom level */
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

3. How to implement headers/footers?

   Configure via [paged media](https://developer.chrome.com/blog/print-margins) in the `mediaPrintStyle`, or set page margins to zero and manually implement the DOM structure for headers/footers.

## Limitations

- It is recommended to specify fixed dimensions (width and height) for the element container, as it cannot adapt to page dimensions when printing.
- Automatic font loading is not supported for non-Chromium browsers. You can declare `@font-face` within the `mediaPrintStyle`, for example:
  ```js
  const mediaPrintStyle = `
    @font-face {
      font-family: 'PrintFont';
      src: url('print-font.woff2') format('woff2');
    }
  `;
  ```
