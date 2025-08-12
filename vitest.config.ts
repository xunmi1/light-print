import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.{test,spec}.ts'],
    name: 'unit',
    environment: 'happy-dom',
    coverage: {
      include: ['src/**.{ts,tsx}'],
    },
    setupFiles: ['tests/unit/vitestSetup.ts'],
    onConsoleLog: (log, type) => {
      // `happy-dom` doesn't actually send requests, so relevant error logs can be ignored.
      return !(type === 'stderr' && log.includes('happy-dom') && log.includes('fetch'));
    },
  },
});
