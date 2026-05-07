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
  {
    rules: {
      // react-hooks v5 introduced set-state-in-effect which produces false
      // positives on async load() calls in effects and derived-state sync
      // patterns. Both are valid in this codebase.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]);

export default eslintConfig;
