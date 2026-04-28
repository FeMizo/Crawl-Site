import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/layout/AppShell";
import LandingSectionRenderer from "../components/landing/LandingSectionRenderer";
import Button from "../components/ui/Button";
import Icon from "../components/ui/Icon";
import Modal from "../components/ui/Modal";
import QuickStepsModule from "../components/shared/QuickStepsModule";
import useSessionUser from "../hooks/useSessionUser";
import { getLandingSections } from "../lib/landing-sections";
import { tUi, useUiLanguage } from "../lib/ui-language";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://crawlsite.app";

const SCHEMA_GRAPH = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "name": "SEO Crawler",
      "url": APP_URL,
      "applicationCategory": "WebApplication",
      "operatingSystem": "Web",
      "description": "Auditor SEO online que detecta errores 404, páginas con noindex, redirecciones y metadatos faltantes en cualquier sitio web.",
      "offers": [
        { "@type": "Offer", "name": "Gratis",   "price": "0",    "priceCurrency": "MXN" },
        { "@type": "Offer", "name": "Basic",    "price": "229",  "priceCurrency": "MXN" },
        { "@type": "Offer", "name": "Starter",  "price": "499",  "priceCurrency": "MXN" },
        { "@type": "Offer", "name": "Pro",      "price": "1299", "priceCurrency": "MXN" },
        { "@type": "Offer", "name": "Agency",   "price": "2999", "priceCurrency": "MXN" },
      ],
    },
    {
      "@type": "HowTo",
      "name": "Cómo auditar un sitio web con SEO Crawler",
      "description": "Analiza tu sitio web en busca de errores SEO en tres pasos.",
      "step": [
        {
          "@type": "HowToStep",
          "position": "1",
          "name": "Crea tu cuenta",
          "text": "Regístrate e inicia sesión para habilitar tu espacio de trabajo y guardar proyectos.",
        },
        {
          "@type": "HowToStep",
          "position": "2",
          "name": "Registra la URL del sitio",
          "text": "Ingresa la URL principal del dominio que quieres auditar para crear el proyecto.",
        },
        {
          "@type": "HowToStep",
          "position": "3",
          "name": "Lanza el rastreo y revisa hallazgos",
          "text": "Ejecuta el rastreo, filtra errores SEO por prioridad y descarga el reporte Excel.",
        },
      ],
    },
  ],
};

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

function projectNameFromUrl(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "Proyecto";
  }
}

export default function HomePage() {
  const router = useRouter();
  const lang = useUiLanguage();
  const t = (key) => tUi(lang, key);
  const { sessionUser, setSessionUser } = useSessionUser();
  const [url, setUrl] = useState("");
  const [loadingUser, setLoadingUser] = useState(!sessionUser);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [upgradeModal, setUpgradeModal] = useState(null);
  const [sections] = useState(getLandingSections());

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me?optional=1")
      .then(async (response) => {
        if (!active) return;
        if (response.ok) {
          const data = await response.json();
          setSessionUser(data.user || null);
          return;
        }
        setSessionUser(null);
      })
      .catch(() => {
        if (active) setSessionUser(null);
      })
      .finally(() => {
        if (active) setLoadingUser(false);
      });
    return () => {
      active = false;
    };
  }, [setSessionUser]);

  const goToDashboard = async () => {
    const normalized = normalizeUrl(url);
    if (!normalized) {
      setError("Ingresa una URL valida.");
      return;
    }
    if (!sessionUser) {
      router.push(
        `/login?next=${encodeURIComponent(`/?url=${encodeURIComponent(normalized)}`)}`,
      );
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectNameFromUrl(normalized),
          targetUrl: normalized,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.upgrade) {
          setUpgradeModal({ plan: data.plan || "FREE", limit: data.limit ?? 1 });
          return;
        }
        throw new Error(data.error || "No se pudo crear el proyecto");
      }
      router.push({
        pathname: "/dashboard",
        query: { projectId: data.project.id, autostart: "1" },
      });
    } catch (err) {
      setError(err.message || "No se pudo crear el proyecto");
    } finally {
      setSubmitting(false);
    }
  };

  const orderedSections = useMemo(() => {
    const context = sessionUser ? "auth" : "guest";
    return [...sections]
      .filter((s) => !s.showFor || s.showFor === "all" || s.showFor === context)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [sections, sessionUser]);

  return (
    <>
      <Head>
        <title>Auditor SEO Online | SEO Crawler</title>
        <meta name="description" content="Introduce una URL, crea el proyecto y obtén un análisis SEO completo: errores 404, noindex, redirecciones y metadatos faltantes detectados al instante." />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_APP_URL || ""}/`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_APP_URL || ""}/`} />
        <meta property="og:site_name" content="SEO Crawler" />
        <meta property="og:locale" content="es_MX" />
        <meta property="og:title" content="Auditor SEO Online | SEO Crawler" />
        <meta property="og:description" content="Introduce una URL, crea el proyecto y obtén un análisis SEO completo: errores 404, noindex, redirecciones y metadatos faltantes detectados al instante." />
        <meta property="og:image" content={`${process.env.NEXT_PUBLIC_APP_URL || ""}/assets/og-image.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="SEO Crawler — Auditor SEO Online" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@aionsite" />
        <meta name="twitter:title" content="Auditor SEO Online | SEO Crawler" />
        <meta name="twitter:description" content="Introduce una URL, crea el proyecto y obtén un análisis SEO completo: errores 404, noindex, redirecciones y metadatos faltantes detectados al instante." />
        <meta name="twitter:image" content={`${process.env.NEXT_PUBLIC_APP_URL || ""}/assets/og-image.png`} />
        <meta name="twitter:image:alt" content="SEO Crawler — Auditor SEO Online" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" type="image/svg+xml" href="/assets/favicon-seo-crawler.svg" />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA_GRAPH) }}
          />
      </Head>
      <AppShell
        activeKey="dashboard"
        user={sessionUser}
        kicker="Inicio / Vista publica"
        title="Nuevo rastreo"
        description="Inicia una auditoria SEO con una URL, crea el proyecto y entra al panel en un solo flujo."
        actions={
          loadingUser ? (
            <span className="btn btn-md btn-ghost">
              Cargando sesion...
            </span>
          ) : sessionUser ? (
            <>
              <Button href="/projects" variant="solid" tone="primary" iconLeft={<Icon name="projects" size={15} />}>
                Proyectos
              </Button>
            </>
          ) : (
            <>
              <Button href="/login" variant="outline" tone="secondary" iconLeft={<Icon name="login" size={15} />}>
                Iniciar sesion
              </Button>
              <Button href="/register" variant="solid" tone="primary" iconLeft={<Icon name="register" size={15} />}>
                Registro
              </Button>
            </>
          )
        }
        aside={
          sessionUser ? undefined : (
            <QuickStepsModule
              title={t("landingAsideTitle")}
              steps={[
                { title: t("landingAsideStep1Title"), detail: t("landingAsideStep1Detail") },
                { title: t("landingAsideStep2Title"), detail: t("landingAsideStep2Detail") },
                { title: t("landingAsideStep3Title"), detail: t("landingAsideStep3Detail") },
              ]}
            />
          )
        }
      >
        <div className="landing-sections">
          {orderedSections.map((section) => (
            <LandingSectionRenderer
              key={section.id}
              section={section}
              heroRuntime={{
                url,
                submitting,
                onUrlChange: setUrl,
                onSubmit: goToDashboard,
              }}
            />
          ))}
        </div>

        {error ? <p className="feedback error">{error}</p> : null}

        {upgradeModal && (
          <Modal
            title="Plan Gratis"
            onClose={() => setUpgradeModal(null)}
            actions={
              <>
                <Button variant="outline" tone="secondary" onClick={() => setUpgradeModal(null)}>
                  Cerrar
                </Button>
                <Button href="/subscription" variant="solid" tone="primary" iconLeft={<Icon name="plus" size={15} />}>
                  Ver planes
                </Button>
              </>
            }
          >
            <div className="upgrade-body">
              <p className="upgrade-msg">
                Alcanzaste el limite de <strong>{upgradeModal.limit}</strong> proyecto en el plan Gratis.
              </p>
              <p className="upgrade-hint">
                En el plan Gratis los proyectos eliminados no liberan espacio. Actualiza tu plan para crear mas proyectos.
              </p>
            </div>
          </Modal>
        )}

        <style jsx>{`
          .upgrade-body { display: grid; gap: 10px; }
          .upgrade-msg { margin: 0; color: var(--text); font-size: 14px; }
          .upgrade-msg strong { color: var(--accent); }
          .upgrade-hint { margin: 0; color: var(--text2); font-size: 13px; }
        `}</style>

        <style jsx>{`
          .landing-sections {
            display: grid;
            gap: 16px;
            min-width: 0;
          }
          .feedback {
            margin: 0;
            color: var(--text2);
          }
          .feedback.error {
            color: var(--error);
          }
        `}</style>
      </AppShell>
    </>
  );
}
