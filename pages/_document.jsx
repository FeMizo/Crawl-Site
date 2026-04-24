import { Html, Head, Main, NextScript } from "next/document";

const INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('seoCrawlerTheme')||'dark';document.documentElement.setAttribute('data-theme',t);var l=localStorage.getItem('seoCrawlerLang')||'es';document.documentElement.lang=l;}catch(e){}})();`;

export default function Document() {
  return (
    <Html lang="es">
      <Head>
        {/* Performance: preconnect to font origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700;800&family=Syne:wght@400;600;800&display=swap"
        />
        <link rel="stylesheet" href="/styles.css" />
        {/* Default viewport — individual pages can override */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {/* Default favicon */}
        <link rel="icon" type="image/svg+xml" href="/assets/favicon-seo-crawler.svg" />
        {/* Theme and language initializer — runs before first paint to avoid flicker */}
        <script dangerouslySetInnerHTML={{ __html: INIT_SCRIPT }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
