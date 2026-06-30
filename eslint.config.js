//  @ts-check

import { tanstackConfig } from "@tanstack/eslint-config"
import pluginSecurity from "eslint-plugin-security"

export default [
  ...tanstackConfig,
  pluginSecurity.configs.recommended,
  {
    rules: {
      "import/no-cycle": "off",
      "import/order": "off",
      "sort-imports": "off",
      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/require-await": "off",
      "pnpm/json-enforce-catalog": "off",
    },
  },
  {
    ignores: ["eslint.config.js", ".prettierrc", "public/sw.js", ".gitnexus/"],
  },
]
