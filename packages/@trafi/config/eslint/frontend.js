/**
 * @trafi/config/eslint/frontend
 *
 * ESLint configuration for frontend apps (dashboard, storefront).
 * Includes restriction on @trafi/db imports.
 */

const baseConfig = require('./index.js');

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  ...baseConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // CRITICAL: Prevent importing @trafi/db in frontend apps
      // All data access must go through API (tRPC or REST)
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@trafi/db', '@trafi/db/*'],
              message:
                'Cannot import @trafi/db in frontend apps. Use API via tRPC instead. Frontend-Database Isolation is CRITICAL.',
            },
            {
              group: ['@prisma/client', '@prisma/client/*'],
              message:
                'Cannot import Prisma client in frontend apps. Use API via tRPC instead.',
            },
          ],
        },
      ],
    },
  },
];
