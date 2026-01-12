import { defineConfig, type UserConfig } from 'vitest/config';

/**
 * Shared Vitest configuration for Trafi packages.
 * Provides consistent test settings across the monorepo.
 */
export const sharedVitestConfig: UserConfig['test'] = {
  globals: true,
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
    exclude: [
      'node_modules',
      'dist',
      '**/*.d.ts',
      '**/*.config.*',
      '**/index.ts',
    ],
    thresholds: {
      statements: 70,
      branches: 70,
      functions: 70,
      lines: 70,
    },
  },
};

/**
 * Creates a Vitest config with shared defaults merged with custom options.
 * @param customConfig - Custom Vitest configuration to merge
 * @returns Complete Vitest configuration
 */
export function createVitestConfig(customConfig: UserConfig = {}): UserConfig {
  return defineConfig({
    test: {
      ...sharedVitestConfig,
      ...customConfig.test,
      coverage: {
        ...sharedVitestConfig.coverage,
        ...(customConfig.test?.coverage ?? {}),
      },
    },
    ...customConfig,
  });
}

export default sharedVitestConfig;
