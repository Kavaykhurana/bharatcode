import type { Config } from "tailwindcss";

/* Tailwind is used for layout only. The colour palette is replaced outright so
   off-system colours cannot creep in — every value mirrors app/globals.css
   (Refero Parchment: ivory, oat, slate, one clay accent). */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      "slate-dark": "#141413",
      "slate-medium": "#3d3d3a",
      "cloud-dark": "#87867f",
      "cloud-medium": "#b0aea5",
      stone: "#cccbc8",
      "oat-warm": "#e3dacc",
      manilla: "#f5e3c7",
      "ivory-medium": "#f0eee6",
      "ivory-light": "#faf9f5",
      clay: "#d97757",
      "clay-deep": "#c6613f"
    },
    extend: {
      fontFamily: {
        serif: ["var(--font-serif)"],
        sans: ["var(--font-sans)"]
      },
      borderRadius: { input: "8px", button: "12px", card: "24px" },
      maxWidth: { page: "1280px" }
    }
  },
  plugins: []
};

export default config;
