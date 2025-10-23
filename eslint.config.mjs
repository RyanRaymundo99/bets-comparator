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
    rules: {
      // Allow unused vars in production builds
      "@typescript-eslint/no-unused-vars": "warn",
      // Allow console.log in development
      "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
      // Allow img tags (Next.js Image optimization warnings)
      "@next/next/no-img-element": "warn",
      // Allow missing dependencies in useEffect
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];

export default eslintConfig;
