// @ts-check
import terser from '@rollup/plugin-terser';
import pkg from '../package.json' with { type: 'json' };

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
  { format: 'es' },
  { format: 'es', min: true },
  { format: 'cjs' },
  { name: 'lightPrint', format: 'iife' },
  { name: 'lightPrint', format: 'iife', min: true },
];

/**
 * @type {import('rollup').OutputOptions[]}
 */
const output = outputFileList.map(({ name, format, min }) => {
  const file = `dist/${pkg.name}${format === 'iife' ? '.global' : ''}${min ? '.min' : ''}${format === 'cjs' ? '.cjs' : '.js'}`;
  const plugins = min ? [terser()] : [];
  return { name, format, banner, file, sourcemap: false, plugins };
});

/**
 * @type {import('rollup').RollupOptions}
 */
export default {
  output,
};
