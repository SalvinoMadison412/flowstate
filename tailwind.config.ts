import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand tokens — 90% of the page is monochrome.
        bg: "#080808",
        surface: {
          DEFAULT: "#111111",
          elevated: "#171717",
        },
        border: {
          subtle: "#222222",
          active: "#333333",
        },
        accent: {
          DEFAULT: "#00C8F0",
          glow: "rgba(0, 200, 240, 0.12)",
        },
        text: {
          primary: "#FFFFFF",
          secondary: "#999999",
          muted: "#555555",
        },
      },
      fontFamily: {
        // Cal Sans (CDN, see app/layout.tsx) with Space Grotesk as the loaded
        // fallback — a wide, heavy grotesque either way.
        display: [
          "Cal Sans",
          "var(--font-space-grotesk)",
          "system-ui",
          "sans-serif",
        ],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        display: "-0.02em",
        wide: "0.02em",
      },
      boxShadow: {
        "accent-glow": "0 0 40px rgba(0, 200, 240, 0.12)",
        "card-lift": "0 12px 40px rgba(0, 0, 0, 0.5)",
      },
      keyframes: {
        "radial-pulse": {
          "0%, 100%": { opacity: "0.04", transform: "scale(1)" },
          "50%": { opacity: "0.09", transform: "scale(1.08)" },
        },
      },
      animation: {
        "radial-pulse": "radial-pulse 7s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
