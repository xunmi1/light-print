# light-print

![Travis (.org)](https://img.shields.io/travis/xunmi1/light-print?style=flat-square)
[![npm bundle size](https://img.shields.io/bundlephobia/min/light-print?style=flat-square)](https://www.npmjs.com/package/light-print)
[![npm](https://img.shields.io/npm/v/light-print?style=flat-square)](https://www.npmjs.com/package/light-print)
[![NPM](https://img.shields.io/npm/l/light-print?style=flat-square)](https://www.npmjs.com/package/light-print)


A lightweight print tool for the browser

### install
```bash
npm install light-print
```

### usage
```js
import lightPrint from 'light-print';

lightPrint(target, { documentTitle, mediaPrintStyle, zoom });
```

### type
```
target: string | Node
// document title
documentTitle?: string,
// additional print style when printing 
mediaPrintStyle?: string,
// page zoom
zoom?: number | string,
```
