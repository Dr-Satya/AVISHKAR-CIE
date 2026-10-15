import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gdgu: {
          navy: "#0a192f",
          navyDark: "#060f1e",
          navyLight: "#132c4a",
          gold: "#c59b27",
          goldLight: "#d4af37",
          goldDark: "#9e7815",
          card: "#ffffff",
          bg: "#f8fafc",
          text: "#09131f",
          muted: "#64748b",
          border: "#e2e8f0",
          success: "#059669",
        },
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.04)",
        elevated: "0 10px 30px -4px rgba(10, 25, 47, 0.08), 0 4px 12px -2px rgba(10, 25, 47, 0.04)",
        card: "0 1px 3px 0 rgba(10, 25, 47, 0.06), 0 1px 2px -1px rgba(10, 25, 47, 0.06)",
        gold: "0 8px 24px -4px rgba(197, 155, 39, 0.22)",
      },
      borderRadius: {
        "3xl": "1.75rem",
      },
    },
  },
  plugins: [],
};
export default config;
