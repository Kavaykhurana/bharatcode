import { Fraunces, Inter, Noto_Sans_Devanagari, Noto_Serif_Devanagari } from "next/font/google";

export const serif = Fraunces({
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-fraunces"
});

export const sans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter"
});

/* Devanagari fallbacks so Hindi keeps the same serif / sans split. */
export const serifDeva = Noto_Serif_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-serif-deva"
});

export const sansDeva = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-sans-deva"
});
