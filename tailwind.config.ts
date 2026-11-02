import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { 950: "#0b0d12", 900: "#11141b", 800: "#181c25", 700: "#232836", 600: "#2f3546" },
        saffron: { 400: "#ffad4d", 500: "#ff9933", 600: "#e67e1a" },
        leaf: { 400: "#3fbf6f", 500: "#138808" }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        devanagari: ["var(--font-deva)", "var(--font-sans)", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
