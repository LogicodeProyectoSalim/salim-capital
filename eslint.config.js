import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  { files: ["src/js/**/*.js"], languageOptions: { sourceType: "script", globals: globals.browser } },
  { files: ["scripts/**/*.mjs"], languageOptions: { sourceType: "module", globals: globals.node } },
  // Las pruebas ejecutan funciones dentro del navegador (page.evaluate).
  {
    files: ["tests/**/*.mjs"],
    languageOptions: { sourceType: "module", globals: { ...globals.node, ...globals.browser } },
  },
];
