import type { Metadata } from "next";
import dynamic from "next/dynamic";
import "./globals.css";

const GdprBanner = dynamic(() => import("../components/GdprBanner"), { ssr: false });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3666"),
  title: "Panel | SEO Crawler",
  description: "Gestiona proyectos SEO, consulta el historial de rastreos y revisa errores detectados desde el panel de control de SEO Crawler.",
  alternates: {
    canonical: "/dashboard/roadmap",
  },
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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;800&family=Manrope:wght@400;500;700;800&family=Syne:wght@400;600;800&display=swap"
        />
      </head>
      <body>
        {children}
        <GdprBanner />
      </body>
    </html>
  );
}
