import js from "@eslint/js";
import nodePlugin from "eslint-plugin-n";
import globals from "globals";
import prettierConfig from "eslint-config-prettier";

export default [
  {
    ignores: ["node_modules/", "dist/", "build/", "coverage/"],
  },

  js.configs.recommended,

  nodePlugin.configs["flat/recommended"],

  prettierConfig,

  {
    files: ["**/*.js"],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",

      globals: {
        ...globals.node,
      },
    },

    rules: {
      "no-unused-vars": "warn",
      "no-console": "off",
      "n/no-missing-import": "error",
      "n/no-unpublished-import": "off",
    },
  },
];
