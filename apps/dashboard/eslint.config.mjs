import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // CRITICAL: Prevent importing @trafi/db in frontend apps
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@trafi/db", "@trafi/db/*"],
              message:
                "Cannot import @trafi/db in frontend apps. Use API via tRPC instead. Frontend-Database Isolation is CRITICAL.",
            },
            {
              group: ["@prisma/client", "@prisma/client/*"],
              message:
                "Cannot import Prisma client in frontend apps. Use API via tRPC instead.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
