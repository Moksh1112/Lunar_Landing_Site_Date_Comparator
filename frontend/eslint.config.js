import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "node_modules"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      // dangerouslySetInnerHTML is never allowed.
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: "dangerouslySetInnerHTML is not allowed.",
        },
      ],
      // Data fetching lives only in src/api/.
      "no-restricted-globals": ["error", { name: "fetch", message: "Call the API through src/api/ only." }],
    },
  },
  {
    files: ["src/api/**/*.{ts,tsx}"],
    rules: { "no-restricted-globals": "off" },
  },
);
