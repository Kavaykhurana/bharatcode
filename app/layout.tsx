import type { Metadata, Viewport } from "next";
import { sans, sansDeva, serif, serifDeva } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Haq — know where to complain, and get it drafted",
  description:
    "Describe a consumer problem in Hindi or English. Haq finds the right forum, drafts the complaint and gives you a dated escalation plan. Built on the BharatCode model API.",
  keywords: ["consumer complaint India", "RBI ombudsman", "UPI failed transaction", "e-Daakhil", "legal notice", "consumer rights", "BharatCode"],
  openGraph: {
    title: "Haq · हक़",
    description: "A consumer-rights agent for India: the right forum, a ready draft and a dated escalation plan.",
    type: "website"
  }
};

export const viewport: Viewport = {
  themeColor: "#fefffc",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${serifDeva.variable} ${sansDeva.variable}`}>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
