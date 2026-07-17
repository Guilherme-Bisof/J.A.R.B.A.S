import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        j: {
          bg: "#07070f",
          surface: "#0b0b17",
          card: "#0f0f1d",
          border: "#1a1a2e",
          hover: "#131328",
          cyan: "#22d3ee",
          violet: "#a78bfa",
          emerald: "#34d399",
          amber: "#fbbf24",
          red: "#f87171",
          text: "#dde2f0",
          muted: "#5a5a80",
          dim: "#2a2a45",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
