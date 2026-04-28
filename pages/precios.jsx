import Head from "next/head";
import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Eyebrow from "../components/ui/Eyebrow";
import Icon from "../components/ui/Icon";
import useSessionUser from "../hooks/useSessionUser";
import { PLANS, FEATURE_LABELS } from "../lib/plan-data";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://crawlsite.app";

function fmt(n) {
  if (n === null || n === undefined || n >= 999) return "Ilimitado";
  return n.toLocaleString("es-MX");
}

const SCHEMA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "url": `${APP_URL}/precios`,
      "name": "Planes y Precios — SEO Crawler",
      "description": "Compara los planes de SEO Crawler: desde auditorías gratuitas hasta rastreos ilimitados con reporte Excel, análisis de arquitectura y acceso API.",
    },
    {
      "@type": "SoftwareApplication",
      "name": "SEO Crawler",
      "url": APP_URL,
      "applicationCategory": "WebApplication",
      "operatingSystem": "Web",
      "offers": PLANS.map((p) => ({
        "@type": "Offer",
        "name": p.label,
        "price": String(p.price),
        "priceCurrency": "MXN",
        "description": `Hasta ${fmt(p.maxProjects)} proyecto(s), ${fmt(p.maxPagesPerCrawl)} páginas/rastreo, ${fmt(p.maxCrawlsPerMonth)} rastreos/mes.`,
      })),
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "¿Puedo cancelar en cualquier momento?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Sí. La cancelación es inmediata desde el panel de facturación. Tu plan permanece activo hasta el fin del periodo facturado.",
          },
        },
        {
          "@type": "Question",
          "name": "¿Qué es una \"página por rastreo\"?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Es el límite de URLs que el crawler analiza en cada ejecución. Si tu sitio tiene más páginas, puedes hacer múltiples rastreos por secciones.",
          },
        },
        {
          "@type": "Question",
          "name": "¿Incluye IVA el precio?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Los precios mostrados no incluyen IVA. El monto final se calcula al momento del pago según tu régimen fiscal.",
          },
        },
        {
          "@type": "Question",
          "name": "¿Qué incluye el Reporte Excel?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Un archivo .xlsx con todas las URLs rastreadas, su código de estado, issues detectados y metadatos, listo para compartir o archivar.",
          },
        },
      ],
    },
  ],
};

function PlanCard({ plan, sessionUser }) {
  const isFree = plan.key === "FREE";
  const ctaHref = sessionUser ? "/subscription" : "/register";
  const ctaLabel = isFree
    ? (sessionUser ? "Tu plan actual" : "Comenzar gratis")
    : (sessionUser ? "Ver planes" : "Registrarse");

  return (
    <div
      className={`plan-card${plan.highlighted ? " highlighted" : ""}`}
      style={{ "--plan-accent": plan.accent }}
    >
      <div className="plan-header">
        <span
          className="plan-badge"
          style={{ color: plan.badge, background: plan.badgeBg, borderColor: plan.badgeBorder }}
        >
          {plan.label}
        </span>
        {plan.highlighted && <span className="popular-tag">Más popular</span>}
      </div>

      <div className="plan-price">
        {isFree ? (
          <span className="price-amount">Gratis</span>
        ) : (
          <>
            <span className="price-amount">${plan.price.toLocaleString("es-MX")}</span>
            <span className="price-currency"> MXN/mes</span>
          </>
        )}
      </div>

      <ul className="plan-limits">
        <li><Icon name="projects" size={12} />{fmt(plan.maxProjects)} proyecto{plan.maxProjects !== 1 ? "s" : ""}</li>
        <li><Icon name="run" size={12} />{fmt(plan.maxPagesPerCrawl)} páginas por rastreo</li>
        <li><Icon name="history" size={12} />{fmt(plan.maxCrawlsPerMonth)} rastreos/mes</li>
        <li><Icon name="history" size={12} />{fmt(plan.maxHistoryRuns)} historial guardado</li>
      </ul>

      {plan.features.length > 0 && (
        <ul className="plan-features">
          {plan.features.map((f) => (
            <li key={f}><Icon name="check" size={11} />{FEATURE_LABELS[f] || f}</li>
          ))}
        </ul>
      )}

      <div className="plan-action">
        <Button
          href={ctaHref}
          variant={plan.highlighted ? "solid" : "outline"}
          tone={plan.highlighted ? "primary" : "secondary"}
        >
          {ctaLabel}
        </Button>
      </div>

      <style jsx>{`
        .plan-card {
          display: grid;
          gap: 16px;
          padding: 20px;
          border: 1px solid var(--border);
          border-radius: 18px;
          background: var(--bg2);
          align-content: start;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .plan-card.highlighted {
          border-color: var(--plan-accent);
          box-shadow: 0 0 0 1px var(--plan-accent) inset, 0 12px 32px rgba(0,0,0,0.18);
        }
        .plan-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .plan-badge {
          display: inline-flex;
          align-items: center;
          min-height: 22px;
          padding: 0 10px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          border: 1px solid;
        }
        .popular-tag {
          font-size: 10px;
          font-weight: 600;
          color: var(--plan-accent);
          letter-spacing: 0.06em;
        }
        .plan-price {
          display: flex;
          align-items: baseline;
          gap: 2px;
          line-height: 1;
        }
        .price-amount {
          font-size: 1.8rem;
          font-weight: 800;
          font-family: "Syne", sans-serif;
          color: var(--text);
        }
        .price-currency {
          font-size: 0.75rem;
          color: var(--muted);
          font-weight: 500;
        }
        .plan-limits,
        .plan-features {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          gap: 8px;
        }
        .plan-limits li,
        .plan-features li {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          color: var(--text2);
        }
        .plan-features {
          border-top: 1px solid var(--border);
          padding-top: 12px;
          margin-top: 4px;
        }
        .plan-features li {
          color: var(--plan-accent);
          font-weight: 600;
        }
        .plan-action :global(.ui-btn) {
          width: 100%;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}

export default function PreciosPage() {
  const { sessionUser } = useSessionUser();

  return (
    <>
      <Head>
        <title>Planes y Precios | SEO Crawler — Auditor SEO Online</title>
        <meta
          name="description"
          content="Compara los planes de SEO Crawler: desde auditorías gratuitas hasta rastreos ilimitados con reporte Excel, análisis de arquitectura y acceso API. Desde $0 MXN/mes."
        />
        <link rel="canonical" href={`${APP_URL}/precios`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${APP_URL}/precios`} />
        <meta property="og:site_name" content="SEO Crawler" />
        <meta property="og:locale" content="es_MX" />
        <meta property="og:title" content="Planes y Precios | SEO Crawler" />
        <meta
          property="og:description"
          content="Compara los planes de SEO Crawler: desde auditorías gratuitas hasta rastreos ilimitados con reporte Excel, análisis de arquitectura y acceso API."
        />
        <meta property="og:image" content={`${APP_URL}/assets/og-image.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="SEO Crawler — Planes y Precios" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@aionsite" />
        <meta name="twitter:title" content="Planes y Precios | SEO Crawler" />
        <meta
          name="twitter:description"
          content="Compara los planes de SEO Crawler: desde auditorías gratuitas hasta rastreos ilimitados con reporte Excel, análisis de arquitectura y acceso API."
        />
        <meta name="twitter:image" content={`${APP_URL}/assets/og-image.png`} />
        <meta name="twitter:image:alt" content="SEO Crawler — Planes y Precios" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" type="image/svg+xml" href="/assets/favicon-seo-crawler.svg" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA) }}
        />
      </Head>

      <AppShell
        activeKey="precios"
        user={sessionUser}
        showSidebar={false}
        kicker="Precios / Planes"
        title="Elige tu plan"
        description="Comienza gratis y escala según el tamaño de tu operación. Todos los planes incluyen detección de 404, noindex, redirecciones y metadatos faltantes."
        actions={
          !sessionUser ? (
            <>
              <Button href="/login" variant="outline" tone="secondary" iconLeft={<Icon name="login" size={15} />}>
                Iniciar sesión
              </Button>
              <Button href="/register" variant="solid" tone="primary" iconLeft={<Icon name="register" size={15} />}>
                Comenzar gratis
              </Button>
            </>
          ) : (
            <Button href="/subscription" variant="solid" tone="primary" iconLeft={<Icon name="settings" size={15} />}>
              Mi suscripción
            </Button>
          )
        }
        aside={
          <div className="precios-aside">
            <div className="sidebar-kicker with-icon">
              <Icon name="shield" size={12} />
              Incluido en todos los planes
            </div>
            <p>Detección de errores 404</p>
            <p>Páginas con noindex</p>
            <p>Redirecciones (301/302)</p>
            <p>Metadatos faltantes</p>
            <p>Historial de rastreos</p>
          </div>
        }
      >
        <div className="precios-content">
          <Card className="intro-card">
            <Eyebrow icon={<Icon name="run" size={12} />}>Comparativa de planes</Eyebrow>
            <p className="intro-text">
              Todos los planes incluyen acceso al panel de auditorías, historial de rastreos y soporte por correo.
              Los planes de pago se facturan mensualmente en MXN. Puedes cambiar o cancelar en cualquier momento.
            </p>
          </Card>

          <div className="plans-grid">
            {PLANS.map((plan) => (
              <PlanCard key={plan.key} plan={plan} sessionUser={sessionUser} />
            ))}
          </div>

          <Card className="faq-card">
            <Eyebrow icon={<Icon name="history" size={12} />}>Preguntas frecuentes</Eyebrow>
            <div className="faq-list">
              <div className="faq-item">
                <h3>¿Puedo cancelar en cualquier momento?</h3>
                <p>Sí. La cancelación es inmediata desde el panel de facturación. Tu plan permanece activo hasta el fin del periodo facturado.</p>
              </div>
              <div className="faq-item">
                <h3>¿Qué es una "página por rastreo"?</h3>
                <p>Es el límite de URLs que el crawler analiza en cada ejecución. Si tu sitio tiene más páginas, puedes hacer múltiples rastreos por secciones.</p>
              </div>
              <div className="faq-item">
                <h3>¿Incluye IVA el precio?</h3>
                <p>Los precios mostrados no incluyen IVA. El monto final se calcula al momento del pago según tu régimen fiscal.</p>
              </div>
              <div className="faq-item">
                <h3>¿Qué incluye el Reporte Excel?</h3>
                <p>Un archivo .xlsx con todas las URLs rastreadas, su código de estado, issues detectados y metadatos, listo para compartir o archivar.</p>
              </div>
            </div>
          </Card>
        </div>

        <style jsx>{`
          .precios-aside {
            display: grid;
            gap: 8px;
          }
          .precios-aside p {
            margin: 0;
            font-size: 12px;
            color: var(--text2);
          }
          .precios-content {
            display: grid;
            gap: 20px;
            min-width: 0;
          }
          .intro-card {
            display: grid;
            gap: 10px;
          }
          .intro-text {
            margin: 0;
            color: var(--text2);
            font-size: 13px;
            line-height: 1.6;
          }
          .plans-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
            gap: 14px;
            align-items: start;
          }
          .faq-card {
            display: grid;
            gap: 16px;
          }
          .faq-list {
            display: grid;
            gap: 16px;
          }
          .faq-item h3 {
            font-family: "Syne", "Manrope", sans-serif;
            font-size: 0.9rem;
            font-weight: 700;
            margin: 0 0 4px;
            color: var(--text);
          }
          .faq-item p {
            margin: 0;
            font-size: 12px;
            color: var(--text2);
            line-height: 1.6;
          }
          @media (max-width: 860px) {
            .plans-grid {
              grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            }
          }
          @media (max-width: 560px) {
            .plans-grid {
              grid-template-columns: 1fr 1fr;
            }
          }
        `}</style>
      </AppShell>
    </>
  );
}
