import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.{test,spec}.ts'],
    name: 'unit',
    environment: 'happy-dom',
    coverage: {
      include: ['src/**.{ts,tsx}'],
    },
    setupFiles: ['tests/unit/setup-vitest.ts'],
  },
});
