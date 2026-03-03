import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";

function normalizeUrl(value) {
  const raw = (value || "").trim();
  if (!raw) return "";
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(withProtocol).toString();
  } catch {
    return "";
  }
}

export default function HomePage() {
  const router = useRouter();
  const [url, setUrl] = useState("");

  const goToDashboard = () => {
    const normalized = normalizeUrl(url);
    if (!normalized) return;
    router.push({
      pathname: "/dashboard",
      query: { url: normalized, autostart: "1" },
    });
  };

  return (
    <>
      <Head>
        <title>SEO Crawler - Inicio</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" type="image/svg+xml" href="/assets/favicon-seo-crawler.svg" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700;800&family=Syne:wght@400;600;800&display=swap"
        />
        <link rel="stylesheet" href="/styles.css" />
      </Head>
      <main className="home-next">
        <section className="home-card-next">
          <h1>SEO Crawler</h1>
          <p>Ingresa una URL para iniciar el analisis y abrir el dashboard.</p>
          <div className="row-next">
            <input
              id="homeUrlInput"
              type="url"
              placeholder="https://www.tu-sitio.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") goToDashboard();
              }}
            />
            <button type="button" onClick={goToDashboard}>
              Iniciar Crawl
            </button>
          </div>
        </section>
      </main>
      <style jsx>{`
        .home-next {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 20px;
          background:
            radial-gradient(1200px 600px at 10% -10%, rgba(79, 151, 255, 0.18), transparent 55%),
            radial-gradient(800px 500px at 90% 120%, rgba(0, 255, 136, 0.14), transparent 58%),
            var(--bg);
        }
        .home-card-next {
          width: min(860px, 100%);
          border: 1px solid var(--line);
          border-radius: 18px;
          background: var(--panel);
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.35);
          padding: 28px;
        }
        .home-card-next h1 {
          margin: 0 0 8px;
          font-family: "Syne", sans-serif;
          font-size: clamp(1.8rem, 2.8vw, 2.4rem);
        }
        .home-card-next p {
          margin: 0 0 16px;
          color: var(--muted);
        }
        .row-next {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
        }
        .row-next input {
          min-height: 48px;
          border-radius: 12px;
          border: 1px solid var(--line);
          background: var(--surface);
          color: var(--text);
          padding: 0 14px;
          outline: none;
          font-size: 15px;
        }
        .row-next button {
          min-height: 48px;
          border-radius: 12px;
          border: 1px solid rgba(89, 170, 255, 0.55);
          background: linear-gradient(135deg, #4f97ff 0%, #6eb2ff 100%);
          color: #061425;
          font-weight: 800;
          padding: 0 18px;
          cursor: pointer;
        }
        @media (max-width: 640px) {
          .row-next {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
