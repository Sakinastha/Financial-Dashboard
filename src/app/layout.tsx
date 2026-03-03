import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Bebas_Neue, Libre_Baskerville } from "next/font/google";
import "./globals.css";

// Primary font - Clean, modern sans-serif for UI and body text
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Monospace font - For financial data, numbers, and tickers
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

// Display font - Bold, condensed for headlines
const bebasNeue = Bebas_Neue({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

// Serif font - Elegant, editorial for accent text
const libreBaskerville = Libre_Baskerville({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Financial Dashboard | SEC EDGAR Data",
  description: "View Revenue, Operating Income, EBITDA, and growth metrics for any US-listed company. Data sourced directly from SEC EDGAR filings.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${bebasNeue.variable} ${libreBaskerville.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
