import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        yellow: {
          DEFAULT: "#F5C518",
          deep: "#E2B400",
          soft: "#FFF6D0",
        },
        ink: {
          DEFAULT: "#1B1B1B",
          soft: "#4A4A4A",
        },
        bg: "#FFFBEA",
        card: "#FFFFFF",
        // Sidebar (dark)
        sb: {
          bg: "#1A1A1F",
          soft: "#25252D",
          border: "rgba(255,255,255,0.08)",
          text: "rgba(255,255,255,0.78)",
          dim: "rgba(255,255,255,0.45)",
        },
        // DR row palette mirrors the Excel report
        dr: {
          high: "#E2EFDA",
          mid: "#FFF2CC",
          zebra: "#F2F7FB",
        },
      },
      fontFamily: {
        sans: ["Helvetica", "Helvetica Neue", "Arial", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 20px rgba(0,0,0,0.06)",
        button: "0 4px 12px rgba(226,180,0,0.35)",
      },
    },
  },
  plugins: [],
};
export default config;
