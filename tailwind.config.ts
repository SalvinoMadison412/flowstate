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
        // Tokens are CSS variables (app/globals.css): light on :root, the
        // original dark values under .theme-dark (the CRM).
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          elevated: "rgb(var(--surface-elevated) / <alpha-value>)",
        },
        border: {
          subtle: "rgb(var(--border-subtle) / <alpha-value>)",
          active: "rgb(var(--border-active) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          ink: "rgb(var(--accent-ink) / <alpha-value>)",
          tint: "rgb(var(--accent-tint) / <alpha-value>)",
          glow: "rgba(0, 200, 240, 0.12)", // dark (CRM) only
        },
        text: {
          primary: "rgb(var(--text-primary) / <alpha-value>)",
          secondary: "rgb(var(--text-secondary) / <alpha-value>)",
          muted: "rgb(var(--text-muted) / <alpha-value>)",
        },
        // Pastel tiles + matching ink — marketing site only.
        tile: {
          sky: "#EAF9FD",
          skyInk: "#00303D",
          peach: "#FFF3ED",
          peachInk: "#381005",
          lime: "#FCFEE2",
          limeInk: "#102B03",
        },
      },
      fontFamily: {
        // Inter Tight (variable) — the marketing site face. The CRM keeps `sans`.
        display: ["var(--font-inter-tight)", "Arial", "sans-serif"],
        site: ["var(--font-inter-tight)", "Arial", "sans-serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        display: "-0.04em",
        tight2: "-0.03em",
        wide: "0.02em",
      },
      borderRadius: { btn: "12px", card: "18px", panel: "48px" },
      maxWidth: { site: "1280px" },
      boxShadow: {
        float: "0 12px 36px -8px rgba(21,21,24,0.10)",
        ring: "0 0 0 0.5px rgb(var(--border-active))",
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
