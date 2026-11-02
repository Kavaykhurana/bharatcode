import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Haq — Know your consumer rights. Get them drafted.",
  description:
    "Describe your problem in Hindi or English. Haq finds the right forum (RBI Ombudsman, Consumer Helpline, e-Daakhil, Bima Bharosa, AirSewa, RERA), drafts your complaint and builds a dated escalation plan. Built on the BharatCode model API.",
  keywords: ["consumer complaint India", "RBI ombudsman", "UPI failed transaction", "e-Daakhil", "legal notice", "consumer rights", "BharatCode"],
  openGraph: {
    title: "Haq — हक़",
    description: "Your AI consumer-rights agent for India: right forum, ready draft, dated escalation plan.",
    type: "website"
  }
};

export const viewport: Viewport = {
  themeColor: "#0b0d12",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink-950 font-sans text-zinc-100 antialiased">{children}</body>
    </html>
  );
}
