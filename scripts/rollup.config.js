// @ts-check
import terser from '@rollup/plugin-terser';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

const RUNTIME_CONTEXT = 'window';

const currentYear = new Date().getFullYear();
const banner = `/*!
 * ${pkg.name} v${pkg.version}
 * (c) ${currentYear > 2020 ? '2020-' : ''}${currentYear} ${pkg.author}
 * Released under the MIT License.
 */
`;

/**
 * @type {{ name?: string; format: import('rollup').ModuleFormat, min?: boolean }[]}
 */
const outputFileList = [
  { name: 'lightPrint', format: 'umd' },
  { name: 'lightPrint', format: 'umd', min: true },
  { format: 'es' },
  { format: 'es', min: true },
];

/**
 * @type {import('rollup').OutputOptions[]}
 */
const output = outputFileList.map(({ name, format, min }) => {
  const file = `dist/${pkg.name}${min ? '.min' : ''}${format === 'umd' ? '.cjs' : '.js'}`;
  const plugins = min ? [terser()] : [];
  return { name, format, banner, file, sourcemap: false, plugins };
});

/**
 * @type {import('rollup').RollupOptions}
 */
export default {
  context: RUNTIME_CONTEXT,
  output,
};
