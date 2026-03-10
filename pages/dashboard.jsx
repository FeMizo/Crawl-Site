import Head from "next/head";
import Script from "next/script";
import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Icon from "../components/ui/Icon";
import StatCard from "../components/ui/StatCard";

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("es-MX");
}

export default function DashboardPage() {
  const [markup, setMarkup] = useState("");
  const [loadError, setLoadError] = useState("");
  const [appReady, setAppReady] = useState(false);
  const [project, setProject] = useState(null);
  const [viewer, setViewer] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeRunId, setActiveRunId] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/legacy-markup", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("No se pudo cargar la interfaz");
        return r.text();
      })
      .then((html) => {
        if (!active) return;
        setMarkup(html);
      })
      .catch((e) => {
        if (!active) return;
        setLoadError(e.message || "Error cargando interfaz");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.search || "");
    const projectId = params.get("projectId");
    const runId = params.get("runId") || "";
    if (!projectId) {
      setLoadError("Falta projectId en la URL.");
      return () => {
        active = false;
      };
    }

    Promise.all([
      fetch("/api/auth/me"),
      fetch(`/api/projects/${projectId}`),
    ])
      .then(async ([meResponse, projectResponse]) => {
        if (meResponse.status === 401 || projectResponse.status === 401) {
          window.location.href = `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
          return null;
        }
        const meData = await meResponse.json();
        const projectData = await projectResponse.json();
        if (!projectResponse.ok) {
          throw new Error(projectData.error || "No se pudo cargar el proyecto");
        }
        return { meData, projectData };
      })
      .then((data) => {
        if (!active || !data) return;
        setViewer(data.meData?.user || null);
        setProject(data.projectData.project);
        setActiveRunId(runId);
      })
      .catch((err) => {
        if (active) setLoadError(err.message || "Error cargando proyecto");
      });

    return () => {
      active = false;
    };
  }, []);

  const canInit = useMemo(
    () => appReady && !!markup && !!project && typeof window !== "undefined",
    [appReady, markup, project],
  );

  useEffect(() => {
    if (!canInit || typeof window.initSeoCrawlerApp !== "function") return;
    window.__SEO_CRAWLER_PROJECT__ = project;
    window.initSeoCrawlerApp();
  }, [canInit, project]);

  useEffect(() => {
    if (!project || !activeRunId || typeof window.loadSeoCrawlerRun !== "function") return;
    fetch(`/api/projects/${project.id}/runs/${activeRunId}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "No se pudo cargar el historial");
        return data;
      })
      .then((data) => {
        window.loadSeoCrawlerRun(data.run);
      })
      .catch((err) => {
        setLoadError(err.message || "No se pudo cargar el historial");
      });
  }, [activeRunId, project]);

  const renameProject = async () => {
    if (!project) return;
    const nextName = window.prompt("Nuevo nombre del proyecto", project.name || "");
    if (!nextName || nextName.trim() === project.name) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nextName.trim(), targetUrl: project.targetUrl }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo renombrar");
      setProject((current) => ({ ...current, ...data.project }));
    } catch (err) {
      setLoadError(err.message || "No se pudo renombrar");
    } finally {
      setSaving(false);
    }
  };

  const deleteProject = async () => {
    if (!project) return;
    const confirmed = window.confirm("Esto eliminara el proyecto y su historial. Continuar?");
    if (!confirmed) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No se pudo eliminar");
      window.location.href = "/projects";
    } catch (err) {
      setLoadError(err.message || "No se pudo eliminar");
      setDeleting(false);
    }
  };

  const openRun = (runId) => {
    setActiveRunId(runId);
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("runId", runId);
    window.history.replaceState({}, "", nextUrl.pathname + nextUrl.search);
  };

  return (
    <>
      <Head>
        <title>SEO Crawler - Panel</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" type="image/svg+xml" href="/assets/favicon-seo-crawler.svg" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700;800&family=Syne:wght@400;600;800&display=swap"
        />
        <link rel="stylesheet" href="/styles.css" />
      </Head>
      <Script src="/app.js" strategy="afterInteractive" onLoad={() => setAppReady(true)} />
      <AppShell
        activeKey="dashboard"
        user={viewer}
        kicker="Paginas / Panel"
        title={project?.name || "Panel"}
        description={project?.targetUrl || "Cargando proyecto..."}
        actions={
          <>
            <Button href="/projects" variant="outline" tone="secondary" iconLeft={<Icon name="projects" size={15} />}>
              Proyectos
            </Button>
            <Button type="button" variant="outline" tone="secondary" onClick={renameProject} loading={saving} iconLeft={<Icon name="edit" size={15} />}>
              Renombrar
            </Button>
            <Button type="button" variant="outline" tone="danger" onClick={deleteProject} loading={deleting} iconLeft={<Icon name="trash" size={15} />}>
              Eliminar
            </Button>
          </>
        }
        aside={
          <div className="dashboard-aside">
            <StatCard label="Rastreos" value={project?.crawlRuns?.length || 0} hint="Recientes" tone="primary" icon={<Icon name="run" size={14} />} />
            <StatCard label="Proyecto" value={project?.name || "--"} hint="Activo" tone="secondary" icon={<Icon name="projects" size={14} />} />
          </div>
        }
      >
        {project ? (
          <div className="dashboard-grid">
            <Card className="history-panel">
              <div className="eyebrow"><Icon name="history" size={12} /> Historial</div>
              <div className="history-list">
                {project.crawlRuns?.map((run) => (
                  <button
                    type="button"
                    key={run.id}
                    className={`history-item${activeRunId === run.id ? " active" : ""}`}
                    onClick={() => openRun(run.id)}
                  >
                    <span>{formatDate(run.createdAt)}</span>
                    <strong>{run.withIssues}/{run.total} con problemas</strong>
                    <small>{run.sourceUrl}</small>
                  </button>
                ))}
                {!project.crawlRuns?.length ? <div className="history-empty">Todavia no hay historial guardado.</div> : null}
              </div>
            </Card>

            <Card className="legacy-surface" padding="sm">
              {loadError ? <div className="feedback error">{loadError}</div> : null}
              <div className="legacy-embed" dangerouslySetInnerHTML={{ __html: markup }} />
            </Card>
          </div>
        ) : loadError ? (
          <Card><div className="feedback error">{loadError}</div></Card>
        ) : (
          <Card><div className="feedback">Cargando dashboard...</div></Card>
        )}

        <style jsx global>{`
          .legacy-embed .global-sidebar,
          .legacy-embed .app > header {
            display: none !important;
          }
          .legacy-embed .app-shell {
            display: block !important;
          }
          .legacy-embed .app {
            width: 100% !important;
            padding: 0 !important;
          }
          .legacy-embed .iz,
          .legacy-embed .sg,
          .legacy-embed .cw,
          .legacy-embed .dlb,
          .legacy-embed .main-layout {
            margin-left: 0 !important;
          }
        `}</style>
        <style jsx>{`
          .dashboard-aside {
            display: grid;
            gap: 12px;
          }
          .dashboard-grid {
            display: grid;
            gap: 18px;
            min-width: 0;
          }
          .history-panel {
            display: grid;
            gap: 16px;
            min-width: 0;
          }
          .eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            color: var(--muted);
            font-size: 11px;
            letter-spacing: 0.22em;
            text-transform: uppercase;
          }
          .history-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 12px;
            min-width: 0;
          }
          .history-item,
          .history-empty {
            border: 1px solid var(--border);
            border-radius: 16px;
            background: var(--bg);
            padding: 16px;
            text-align: left;
            color: var(--text);
            min-width: 0;
            overflow: hidden;
          }
          .history-item {
            cursor: pointer;
            display: grid;
            gap: 6px;
          }
          .history-item.active {
            border-color: rgba(77, 141, 255, 0.4);
            box-shadow: 0 0 0 1px rgba(77, 141, 255, 0.3) inset;
          }
          .history-item span,
          .history-item small,
          .history-empty {
            color: var(--muted);
            overflow-wrap: anywhere;
          }
          .legacy-surface {
            overflow: hidden;
            min-width: 0;
          }
          .feedback {
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
