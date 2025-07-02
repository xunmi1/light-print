// @ts-check
import { dts } from 'rollup-plugin-dts';
import pkg from '../package.json' with { type: 'json' };

/**
 * @type {import('rollup').RollupOptions}
 */
export default {
  output: [
    { file: `dist/${pkg.name}.d.ts`, format: 'es' },
    { file: `dist/${pkg.name}.d.cts`, format: 'cjs' },
  ],
  plugins: [dts()],
};
