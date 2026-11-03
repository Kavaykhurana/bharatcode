import { Inter, Noto_Sans_Devanagari, Noto_Serif_Devanagari, Source_Serif_4 } from "next/font/google";

/* Refero Parchment substitutes for the proprietary Anthropic faces:
   Source Serif 4 is the voice (body, editorial), Inter is the chrome (nav, buttons, labels). */
export const serif = Source_Serif_4({
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-source-serif"
});

export const sans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter"
});

/* Devanagari fallbacks so Hindi keeps the same serif / sans split. */
export const serifDeva = Noto_Serif_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-serif-deva"
});

export const sansDeva = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sans-deva"
});
