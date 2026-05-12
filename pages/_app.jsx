import Head from "next/head";
import GdprBanner from "../components/GdprBanner";

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, viewport-fit=cover"
        />
        {/* Mobile Chrome */}
        <meta name="theme-color" content="#0a0f1a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        {/* Android */}
        <link rel="manifest" href="/manifest.json" />
      </Head>
      <Component {...pageProps} />
      <GdprBanner />
    </>
  );
}
