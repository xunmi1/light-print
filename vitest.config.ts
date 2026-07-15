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
    environmentOptions: {
      happyDOM: {
        url: 'http://localhost:3000',
        settings: {
          enableImageFileLoading: true,
          fetch: {
            virtualServers: [
              {
                url: 'http://localhost:3000',
                directory: './examples',
              },
            ],
          },
        },
      },
    },
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
  },
});
