# light-print

[![ci](https://img.shields.io/github/actions/workflow/status/xunmi1/light-print/ci.yml?style=flat-square&logo=github)](https://github.com/xunmi1/light-print/actions/workflows/ci.yml)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/light-print?style=flat-square)](https://www.npmjs.com/package/light-print)
[![npm](https://img.shields.io/npm/v/light-print?style=flat-square)](https://www.npmjs.com/package/light-print)
[![license](https://img.shields.io/npm/l/light-print?style=flat-square)](https://www.npmjs.com/package/light-print)

A lightweight print tool for the browser.

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

If the browser does not support Promise (e.g. IE browser), then a global Promise polyfill is needed.

## Usage

Print container elements and their descendants.

```js
import lightPrint from 'light-print';

lightPrint('#id', { mediaPrintStyle: `@page { size: A4 portrait }` }).then(() => {
  // do something when exiting the print window.
});
```

- The argument can either be a CSS selector or an actual DOM element.
- Returns a Promise when exiting the print window.

### Usage in Vue

```vue
<script setup>
import { useTemplateRef } from 'vue';
import lightPrint from 'light-print';
// In versions prior to 3.5, we could declare a `ref` with the same name as a ref attribute in the template.
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

In other frameworks, a similar approach can be adopted for usage.

## Types

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

### Limitations

- Does not support resources introduced in styles, such as `background-image: url(...)`.
