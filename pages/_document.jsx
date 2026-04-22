import { Html, Head, Main, NextScript } from "next/document";

const INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('seoCrawlerTheme')||'dark';document.documentElement.setAttribute('data-theme',t);var l=localStorage.getItem('seoCrawlerLang')||'es';document.documentElement.lang=l;}catch(e){}})();`;

export default function Document() {
  return (
    <Html>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700;800&family=Syne:wght@400;600;800&display=swap"
        />
        <link rel="stylesheet" href="/styles.css" />
        <script dangerouslySetInnerHTML={{ __html: INIT_SCRIPT }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
