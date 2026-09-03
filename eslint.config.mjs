import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "main.js",
      "node_modules/",
      "character-plugin-vault/",
      ".tmp/"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts", "tests/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.browser
      }
    },
    rules: {
      "no-restricted-globals": [
        "error",
        { name: "app", message: "Use this.app instead of the global app (G2-03)." }
      ],
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "obsidian",
              importNames: ["requestUrl", "request"],
              message: "No runtime network access or telemetry (G2-08)."
            }
          ]
        }
      ]
    }
  },
  {
    files: ["src/**/*.ts"],
    rules: {
      "no-restricted-properties": [
        "error",
        { object: "window", property: "app", message: "Use this.app instead of window.app (G2-03)." },
        { property: "innerHTML", message: "Build UI with DOM APIs and Obsidian helpers (G2-20)." },
        { property: "outerHTML", message: "Build UI with DOM APIs and Obsidian helpers (G2-20)." },
        { property: "insertAdjacentHTML", message: "Build UI with DOM APIs and Obsidian helpers (G2-20)." },
        { property: "requestUrl", message: "No runtime network access or telemetry (G2-08)." }
      ]
    }
  },
  {
    files: ["tests/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  },
  {
    files: ["**/*.mjs", "scripts/**/*.mjs"],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  }
);
