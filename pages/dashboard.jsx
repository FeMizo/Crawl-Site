import Head from "next/head";
import Script from "next/script";
import { useEffect, useMemo, useState } from "react";

export default function DashboardPage() {
  const [markup, setMarkup] = useState("");
  const [loadError, setLoadError] = useState("");
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/legacy-markup", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("No se pudo cargar la interfaz");
        return r.text();
      })
      .then((html) => {
        if (!active) return;
        setMarkup(html);
      })
      .catch((e) => {
        if (!active) return;
        setLoadError(e.message || "Error cargando interfaz");
      });
    return () => {
      active = false;
    };
  }, []);

  const canInit = useMemo(
    () => appReady && !!markup && typeof window !== "undefined",
    [appReady, markup],
  );

  useEffect(() => {
    if (!canInit || typeof window.initSeoCrawlerApp !== "function") return;
    window.initSeoCrawlerApp();
  }, [canInit]);

  return (
    <>
      <Head>
        <title>SEO Crawler - Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" type="image/svg+xml" href="/assets/favicon-seo-crawler.svg" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700;800&family=Syne:wght@400;600;800&display=swap"
        />
        <link rel="stylesheet" href="/styles.css" />
      </Head>
      <Script src="/app.js" strategy="afterInteractive" onLoad={() => setAppReady(true)} />
      {loadError ? (
        <div style={{ padding: 24, fontFamily: "Manrope, sans-serif", color: "#ff5252" }}>
          {loadError}
        </div>
      ) : (
        <div dangerouslySetInnerHTML={{ __html: markup }} />
      )}
    </>
  );
}
