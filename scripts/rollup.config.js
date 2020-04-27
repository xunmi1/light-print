import json from '@rollup/plugin-json';
import sucrase from '@rollup/plugin-sucrase';
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import pkg from '../package.json';


const currentYear = new Date().getFullYear();
const banner =
`/*!
 * ${pkg.name} v${pkg.version}
 * (c) ${currentYear > 2020 ? '2020-' : ''}${currentYear} ${pkg.author}
 * Released under the MIT License.
 */
`;

const outputFileList = [
  { name: 'LightPrint', format: 'umd' },
  { name: 'LightPrint', format: 'umd', min: true },
  { format: 'esm' },
  { format: 'esm', min: true },
];

const output = outputFileList.map(config => {
  const file = `dist/${pkg.name}.${config.format}${config.min ? '.min' : ''}.js`;
  return { name: config.name, format: config.format, banner, file, sourcemap: !config.min };
});

const terserOptions = {
  include: [/^.+\.min\.js$/],
  output: { comments: `/${pkg.name} v${pkg.version}/` },
};

export default {
  input: 'src/index.ts',
  output,
  plugins: [
    json({ namedExports: false }),
    resolve({ extensions: ['.js', '.ts'] }),
    sucrase({
      exclude: ['node_modules/**'],
      transforms: ['typescript']
    }),
    terser(terserOptions),
  ],
};

