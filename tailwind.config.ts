import type { Config } from "tailwindcss";

/* Tailwind is used for layout only. The colour palette is replaced outright so
   off-system colours cannot creep in — every value mirrors app/globals.css. */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      white: "#ffffff",
      parchment: "#fefffc",
      paper: "#ffffff",
      linen: "#f9faf7",
      "ink-black": "#171717",
      graphite: "#2c2c2c",
      charcoal: "#444141",
      ash: "#646464",
      fog: "#b4b8b4",
      mist: "#dee2de",
      twilight: "#282834",
      dusk: "#1f1f29",
      "signal-blue": "#41a1cf",
      "signal-ink": "#0077b3",
      cerulean: "#0081c0",
      ember: "#a5462b",
      moss: "#3f6b3b"
    },
    extend: {
      fontFamily: {
        serif: ["var(--font-serif)"],
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"]
      },
      borderRadius: { tag: "4px", btn: "8px", card: "12px", diagram: "16px", surface: "24px", pill: "50px" },
      maxWidth: { page: "1200px" }
    }
  },
  plugins: []
};

export default config;
