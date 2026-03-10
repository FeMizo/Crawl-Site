import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/layout/AppShell";
import LandingSectionRenderer from "../components/landing/LandingSectionRenderer";
import Button from "../components/ui/Button";
import Icon from "../components/ui/Icon";
import { getLandingSections } from "../lib/landing-sections";

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
  const [url, setUrl] = useState("");
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sections] = useState(getLandingSections());

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then(async (response) => {
        if (!active) return;
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          return;
        }
        setUser(null);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoadingUser(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const goToDashboard = async () => {
    const normalized = normalizeUrl(url);
    if (!normalized) {
      setError("Ingresa una URL valida.");
      return;
    }
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/?url=${encodeURIComponent(normalized)}`)}`);
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
      if (!response.ok) throw new Error(data.error || "No se pudo crear el proyecto");
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

  const orderedSections = useMemo(
    () => [...sections].sort((a, b) => (a.order || 0) - (b.order || 0)),
    [sections],
  );

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
      <AppShell
        activeKey="dashboard"
        user={user}
        kicker="Landing / Publica"
        title="Nuevo rastreo"
        description="Inicia una auditoria SEO con una URL, crea el proyecto y entra al dashboard en un solo flujo."
        actions={
          loadingUser ? (
            <span className="ui-btn ui-btn-outline ui-btn-secondary ui-btn-md">Cargando sesion...</span>
          ) : user ? (
            <>
              <span className="ui-btn ui-btn-outline ui-btn-secondary ui-btn-md">{user.email}</span>
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
          <div className="landing-aside">
            <div className="sidebar-kicker with-icon">
              <Icon name="roadmap" size={12} />
              Flujo recomendado
            </div>
            <p>1. Captura la URL principal.</p>
            <p>2. Crea el proyecto.</p>
            <p>3. Revisa y prioriza hallazgos SEO.</p>
          </div>
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

        <style jsx>{`
          .landing-aside {
            display: grid;
            gap: 8px;
          }
          .landing-aside p {
            margin: 0;
            color: var(--text2);
          }
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
