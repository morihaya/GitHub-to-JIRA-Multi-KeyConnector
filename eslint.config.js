import js from "@eslint/js";
import jest from "eslint-plugin-jest";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";

export default [
  js.configs.recommended,
  eslintConfigPrettier,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        chrome: "readonly",
      },
    },
    rules: {
      "no-console": "off",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["tests/**/*.js"],
    ...jest.configs["flat/recommended"],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      ...jest.configs["flat/recommended"].rules,
      "jest/no-conditional-expect": "error",
    },
  },
  {
    ignores: ["node_modules/", "coverage/", "dist/", "*.zip"],
  },
];
