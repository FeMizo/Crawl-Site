import Head from "next/head";
import AppShell from "../components/layout/AppShell";
import Card from "../components/ui/Card";
import Eyebrow from "../components/ui/Eyebrow";
import Icon from "../components/ui/Icon";
import { tUi, useUiLanguage } from "../lib/ui-language";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://crawlsite.app";

export default function TerminosPage() {
  const lang = useUiLanguage();
  const t = (key) => tUi(lang, key);

  return (
    <>
      <Head>
        <title>{t("termsPageTitle")} | SEO Crawler</title>
        <meta
          name="description"
          content={t("termsPageDesc")}
        />
        <link rel="canonical" href={`${APP_URL}/terminos`} />
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${APP_URL}/terminos`} />
        <meta property="og:title" content={`${t("termsPageTitle")} | SEO Crawler`} />
        <meta property="og:description" content={t("termsPageDesc")} />
        <meta property="og:image" content={`${APP_URL}/assets/og-image.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="SEO Crawler — Términos y Condiciones" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@aionsite" />
        <meta name="twitter:title" content={`${t("termsPageTitle")} | SEO Crawler`} />
        <meta name="twitter:description" content={t("termsPageDesc")} />
        <meta name="twitter:image" content={`${APP_URL}/assets/og-image.png`} />
        <meta name="twitter:image:alt" content="SEO Crawler — Términos y Condiciones" />
      </Head>

      <AppShell
        activeKey=""
        user={null}
        showSidebar={false}
        kicker={t("termsKicker")}
        title={t("termsPageTitle")}
        description={t("termsPageDesc")}
      >
        <Card className="terms-card">
          <Eyebrow icon={<Icon name="shield" size={12} />}>AIONSITE</Eyebrow>

          <div className="terms-body">
            <section>
              <h2>{t("termsSection1")}</h2>
              <p>{t("termsSection1Text")}</p>
            </section>

            <section>
              <h2>{t("termsSection2")}</h2>
              <p>{t("termsSection2Text")}</p>
            </section>

            <section>
              <h2>{t("termsSection3")}</h2>
              <p>{t("termsSection3Text")}</p>
            </section>

            <section>
              <h2>{t("termsSection4")}</h2>
              <p>{t("termsSection4Text")}</p>
            </section>

            <section>
              <h2>10. Ley aplicable</h2>
              <p>
                Estos Términos se rigen por las leyes de los <strong>Estados Unidos Mexicanos</strong>.
                Cualquier disputa será sometida a la jurisdicción de los tribunales competentes de
                la Ciudad de México, renunciando a cualquier otro fuero que pudiera corresponder.
              </p>
            </section>

            <section>
              <h2>11. Contacto</h2>
              <p>
                Para cualquier pregunta sobre estos Términos y Condiciones, contáctanos en{" "}
                <a href="mailto:contacto@aionsite.com.mx">contacto@aionsite.com.mx</a>.
              </p>
            </section>
          </div>
        </Card>

        <style jsx>{`
          .terms-card {
            display: grid;
            gap: 20px;
          }
          .terms-body {
            display: grid;
            gap: 20px;
          }
          .terms-body section {
            display: grid;
            gap: 8px;
          }
          .terms-body h2 {
            font-family: "Syne", "Manrope", sans-serif;
            font-size: 0.95rem;
            font-weight: 700;
            margin: 0;
            color: var(--text);
          }
          .terms-body p {
            margin: 0;
            font-size: 13px;
            color: var(--text2);
            line-height: 1.7;
          }
          .terms-body ul {
            margin: 0;
            padding-left: 20px;
            display: grid;
            gap: 4px;
          }
          .terms-body li {
            font-size: 13px;
            color: var(--text2);
            line-height: 1.6;
          }
          .terms-body a {
            color: var(--accent);
            text-decoration: none;
          }
          .terms-body a:hover {
            text-decoration: underline;
          }
          .terms-body strong {
            color: var(--text);
          }
        `}</style>
      </AppShell>
    </>
  );
}
