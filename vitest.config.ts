import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    name: 'unit',
    reporters: process.env.GITHUB_ACTIONS ? ['dot', 'github-actions'] : ['default'],
    include: ['tests/unit/**/*.{test,spec}.ts'],
    environment: 'happy-dom',
    typecheck: {
      enabled: true,
      tsconfig: 'tsconfig.check.json',
      include: ['tests/unit/**/*.{test,spec}-d.ts'],
    },
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts'],
    },
    setupFiles: ['tests/unit/vitestSetup.ts'],
    onConsoleLog(log, type) {
      // `happy-dom` doesn't actually send requests, so relevant error logs can be ignored.
      return !(type === 'stderr' && log.search(/fetch|connect/i) > -1);
    },
  },
});
