import "./globals.css";

export const metadata = {
  title: "TradingPlatform — Gerçek Zamanlı Döviz Alım-Satım",
  description: "Canlı döviz kurları ile güvenli döviz alım-satım platformu. USD, EUR, GBP ile TRY arasında anında işlem yapın.",
  keywords: ["döviz", "trading", "alım satım", "forex", "kur", "exchange"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('theme');
                if (theme === 'dark') {
                  document.documentElement.setAttribute('data-theme', 'dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
