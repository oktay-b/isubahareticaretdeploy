import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TradingPlatform — Gerçek Zamanlı Döviz Alım-Satım",
  description: "Canlı döviz kurları ile güvenli döviz alım-satım platformu. USD, EUR, GBP ile TRY arasında anında işlem yapın.",
  keywords: ["döviz", "trading", "alım satım", "forex", "kur", "exchange"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
