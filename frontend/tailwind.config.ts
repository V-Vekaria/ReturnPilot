import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172B35",
        teal: "#146C72",
        pale: "#ECF7F5",
        sand: "#F7F5EF",
        "teal-dark": "#0e5459",
        "teal-light": "#1a8a92",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px 0 rgba(0,0,0,0.04)",
        "card-hover": "0 4px 12px 0 rgba(0,0,0,0.10), 0 2px 4px 0 rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
} satisfies Config;
