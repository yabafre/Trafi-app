import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for @trafi/types package.
 *
 * Note: Uses inline config instead of shared config from @trafi/config/testing
 * because @trafi/config doesn't have a build step yet. When a build step is
 * added, this can be replaced with: import { createVitestConfig } from '@trafi/config/testing/vitest';
 */
export default defineConfig({
  test: {
    globals: true,
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules',
        'dist',
        '**/*.d.ts',
        '**/*.config.*',
        'src/index.ts',
      ],
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },
  },
});
