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
          navy: "#0d2137",
          navyDark: "#081625",
          navyLight: "#163456",
          gold: "#cda34f",
          goldLight: "#dfb967",
          goldDark: "#b38936",
          card: "#ffffff",
          bg: "#edf1f7",
          text: "#1e293b",
          muted: "#64748b",
          border: "#e2e8f0",
          success: "#16a34a",
        },
      },
    },
  },
  plugins: [],
};
export default config;
