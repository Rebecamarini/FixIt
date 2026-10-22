import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}"],
    ignores: ["src/**/*.d.{ts,mts,cts}", "src/**/generated/**", "src/**/__generated__/**"],
    rules: {
      complexity: ["error", { max: 10, variant: "classic" }],
      "max-depth": ["error", 4],
      "max-lines-per-function": ["error", {
        max: 50,
        IIFEs: true,
        skipBlankLines: true,
        skipComments: true,
      }],
    },
  },
  globalIgnores([".next/**", "out/**", "next-env.d.ts", "supabase/.temp/**"]),
]);
