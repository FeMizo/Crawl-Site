import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Icon from "../components/ui/Icon";
import Input from "../components/ui/Input";
import StatCard from "../components/ui/StatCard";

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
        kicker="Paginas / Panel"
        title="Nuevo rastreo"
        description="Analiza SEO tecnico, metadatos, headings, imagenes y funcionalidad usando el mismo lenguaje visual del panel principal."
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
          <div className="steps">
            <div className="step-item"><strong>1</strong><span>Registrar usuario</span></div>
            <div className="step-item"><strong>2</strong><span>Crear proyecto</span></div>
            <div className="step-item"><strong>3</strong><span>Guardar historial</span></div>
          </div>
        }
      >
        <div className="hero-grid">
          <Card className="hero-card">
            <div className="hero-copy">
              <div className="eyebrow">URL inicial</div>
              <h2>Define la URL inicial y entra al panel operativo</h2>
              <p>
                Esta vista ya usa el mismo sistema visual del panel. El proyecto se crea
                y entra directo a la experiencia principal.
              </p>
            </div>
            <div className="hero-form">
              <Input
                label="URL del sitio a analizar"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.tu-sitio.com"
              />
              <Button
                type="button"
                variant="solid"
                tone="primary"
                size="lg"
                onClick={goToDashboard}
                loading={submitting}
                iconLeft={<Icon name="dashboard" size={16} />}
              >
                Crear y analizar
              </Button>
            </div>
            {error ? <p className="feedback error">{error}</p> : null}
          </Card>

          <div className="stat-grid">
            <StatCard label="Persistencia" value="Docker" hint="Postgres local" tone="primary" icon={<Icon name="database" size={14} />} />
            <StatCard label="Autenticacion" value="JWT" hint="Cookie segura" tone="secondary" icon={<Icon name="shield" size={14} />} />
            <StatCard label="Historial" value="Corridas" hint="Por usuario y proyecto" tone="primary" icon={<Icon name="history" size={14} />} />
          </div>
        </div>

        <style jsx>{`
          .steps {
            display: grid;
            gap: 10px;
          }
          .step-item {
            display: grid;
            grid-template-columns: 26px 1fr;
            gap: 10px;
            align-items: center;
            color: var(--text2);
          }
          .step-item strong {
            width: 26px;
            height: 26px;
            display: grid;
            place-items: center;
            border-radius: 999px;
            background: rgba(77, 141, 255, 0.14);
            color: #77abff;
          }
          .hero-grid {
            display: grid;
            grid-template-columns: minmax(0, 1.35fr) minmax(260px, 0.65fr);
            gap: 18px;
            min-width: 0;
          }
          .hero-card {
            background: linear-gradient(180deg, rgba(18, 36, 66, 0.95), rgba(12, 25, 48, 0.95));
            gap: 18px;
          }
          .hero-copy {
            min-width: 0;
          }
          .hero-copy h2 {
            font-family: "Syne", "Manrope", sans-serif;
            font-weight: 700;
            font-size: clamp(1.45rem, 2.2vw, 2.05rem);
            line-height: 1.04;
            margin: 0 0 12px;
            overflow-wrap: anywhere;
          }
          .hero-copy p {
            margin: 0 0 18px;
            color: var(--text2);
            overflow-wrap: anywhere;
          }
          .eyebrow {
            color: var(--muted);
            font-size: 11px;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            margin-bottom: 12px;
          }
          .hero-form {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 14px;
            align-items: end;
            min-width: 0;
          }
          .stat-grid {
            display: grid;
            gap: 14px;
            align-content: start;
            min-width: 0;
          }
          .feedback {
            margin: 2px 0 0;
            color: var(--text2);
          }
          .feedback.error {
            color: var(--error);
          }
          @media (max-width: 960px) {
            .hero-grid {
              grid-template-columns: 1fr;
            }
          }
          @media (max-width: 680px) {
            .hero-form {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </AppShell>
    </>
  );
}
