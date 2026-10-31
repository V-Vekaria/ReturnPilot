import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: { colors: { ink: "#172B35", teal: "#146C72", pale: "#ECF7F5", sand: "#F7F5EF" } } },
  plugins: [],
} satisfies Config;
