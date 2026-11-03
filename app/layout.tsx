import type { Metadata, Viewport } from "next";
import { sans, sansDeva, serif, serifDeva } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://haq-glqi.onrender.com"),
  title: "Haq — know where to complain, and get it drafted",
  description:
    "Describe a consumer problem in Hindi or English. Haq finds the right forum, drafts the complaint and gives you a dated escalation plan. Built on the BharatCode model API.",
  keywords: ["consumer complaint India", "RBI ombudsman", "UPI failed transaction", "e-Daakhil", "legal notice", "consumer rights", "BharatCode"],
  openGraph: {
    title: "Haq · हक़",
    description: "A consumer-rights agent for India: the right forum, a ready draft and a dated escalation plan.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Haq — know where to complain, get it drafted" }]
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] }
};

export const viewport: Viewport = {
  themeColor: "#f0eee6",
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
