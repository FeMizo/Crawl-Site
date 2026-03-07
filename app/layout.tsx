import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SEO Crawler Dashboard",
  description: "Panel interno de SEO Crawler",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" type="image/svg+xml" href="/assets/favicon-seo-crawler.svg" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700;800&family=Syne:wght@400;600;800&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
