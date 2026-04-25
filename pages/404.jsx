import Head from "next/head";
import Link from "next/link";
import { tUi, useUiLanguage } from "../lib/ui-language";

export default function NotFoundPage() {
  const lang = useUiLanguage();
  const t = (key) => tUi(lang, key);

  return (
    <>
      <Head>
        <title>404 — SEO Crawler</title>
        <meta name="robots" content="noindex" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" type="image/svg+xml" href="/assets/favicon-seo-crawler.svg" />
      </Head>

      <div className="not-found-shell">
        <div className="not-found-content">
          <span className="not-found-kicker">{t("notFoundKicker")}</span>
          <div className="not-found-code" aria-hidden="true">404</div>
          <h1 className="not-found-title">{t("notFoundTitle")}</h1>
          <p className="not-found-desc">{t("notFoundDesc")}</p>
          <Link href="/" className="not-found-btn">
            {t("notFoundBtn")}
          </Link>
        </div>

        <style jsx global>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          :root {
            --bg: #0a0f1a;
            --bg2: #0f1623;
            --bg3: #161e2e;
            --text: #e8edf5;
            --text2: #8fa0ba;
            --muted: #4a5a72;
            --border: rgba(255,255,255,0.07);
            --border2: rgba(255,255,255,0.13);
            --accent: #00ff88;
            --adim: rgba(0,255,136,0.1);
            --blue: #4d8dff;
          }
          [data-theme="light"] {
            --bg: #f5f7fb;
            --bg2: #ffffff;
            --bg3: #eef1f7;
            --text: #0d1421;
            --text2: #4a5a72;
            --muted: #8fa0ba;
            --border: rgba(0,0,0,0.08);
            --border2: rgba(0,0,0,0.14);
          }
          html, body { height: 100%; }
          body {
            font-family: "Manrope", system-ui, sans-serif;
            background: var(--bg);
            color: var(--text);
            min-height: 100vh;
          }
        `}</style>

        <style jsx>{`
          .not-found-shell {
            min-height: 100vh;
            display: grid;
            place-items: center;
            padding: 40px 24px;
            background:
              radial-gradient(900px 600px at 20% 0%, rgba(0,255,136,0.06), transparent 55%),
              radial-gradient(700px 500px at 80% 100%, rgba(77,141,255,0.08), transparent 55%),
              var(--bg);
          }
          .not-found-content {
            display: grid;
            gap: 16px;
            text-align: center;
            max-width: 480px;
          }
          .not-found-kicker {
            font-size: 11px;
            color: var(--muted);
            letter-spacing: 0.22em;
            text-transform: uppercase;
          }
          .not-found-code {
            font-family: "Syne", "Manrope", sans-serif;
            font-size: clamp(6rem, 20vw, 10rem);
            font-weight: 700;
            line-height: 1;
            background: linear-gradient(135deg, #4d8dff 0%, #00ff88 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .not-found-title {
            font-family: "Syne", "Manrope", sans-serif;
            font-size: clamp(1.4rem, 4vw, 2rem);
            font-weight: 700;
            line-height: 1.1;
            color: var(--text);
          }
          .not-found-desc {
            color: var(--text2);
            font-size: 15px;
            line-height: 1.6;
          }
          .not-found-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin: 8px auto 0;
            min-height: 44px;
            padding: 0 24px;
            border-radius: 14px;
            background: #4d8dff;
            border: 1px solid #4d8dff;
            color: #071226;
            font-family: "Syne", "Manrope", sans-serif;
            font-weight: 700;
            font-size: 15px;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            text-decoration: none;
            transition: all 0.2s ease;
            box-shadow: 0 8px 18px rgba(44,103,197,0.32);
            width: fit-content;
          }
          .not-found-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 24px rgba(44,103,197,0.4);
          }
          .not-found-btn:active {
            transform: translateY(0);
            opacity: 0.9;
          }
        `}</style>
      </div>
    </>
  );
}
