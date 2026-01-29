import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    settings: {
      tailwindcss: {
        callees: ["cn", "twMerge", "tv"],
      },
    },
    rules: {
      // 未使用変数の警告をオフ（既存の設定）
      "@typescript-eslint/no-unused-vars": "off",

      // any型の使用を許可（今回追加）
      "@typescript-eslint/no-explicit-any": "off",

      // imgタグの使用を許可（今回追加）
      "@next/next/no-img-element": "off",
    },
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
