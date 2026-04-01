import Head from "next/head";
import Script from "next/script";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Eyebrow from "../components/ui/Eyebrow";
import Icon from "../components/ui/Icon";
import StatCard from "../components/ui/StatCard";
import useSessionUser from "../hooks/useSessionUser";
import { tUi, useUiLanguage } from "../lib/ui-language";

let legacyMarkupCache = "";

function formatDate(value, lang) {
  if (!value) return "";
  const locale = lang === "en" ? "en-US" : "es-MX";
  return new Date(value).toLocaleString(locale);
}

export default function DashboardPage() {
  const router = useRouter();
  const lang = useUiLanguage();
  const t = (key) => tUi(lang, key);
  const { sessionUser, setSessionUser, clearSessionUser } = useSessionUser();
  const [markup, setMarkup] = useState(() => legacyMarkupCache);
  const [loadError, setLoadError] = useState("");
  const [appReady, setAppReady] = useState(false);
  const [project, setProject] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeRunId, setActiveRunId] = useState("");
  const runCacheRef = useRef(new Map());

  useEffect(() => {
    if (legacyMarkupCache) return undefined;
    let active = true;
    fetch("/api/legacy-markup")
      .then((r) => {
        if (!r.ok) throw new Error("No se pudo cargar la interfaz");
        return r.text();
      })
      .then((html) => {
        if (!active) return;
        legacyMarkupCache = html;
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

    fetch(`/api/projects/${projectId}`)
      .then(async (projectResponse) => {
        if (projectResponse.status === 401) {
          clearSessionUser();
          router.replace(
            `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`,
          );
          return null;
        }
        const projectData = await projectResponse.json();
        if (!projectResponse.ok) {
          throw new Error(projectData.error || "No se pudo cargar el proyecto");
        }
        return projectData;
      })
      .then((projectData) => {
        if (!active || !projectData) return;
        setSessionUser(projectData.viewer || null);
        const projectPayload = projectData.project;
        const projectRuns = Array.isArray(projectPayload?.crawlRuns)
          ? projectPayload.crawlRuns
          : [];
        const hasRequestedRun = !!runId && projectRuns.some((run) => run.id === runId);
        const initialRunId = hasRequestedRun ? runId : (projectRuns[0]?.id || "");

        setProject(projectPayload);
        setActiveRunId(initialRunId);

        if (initialRunId && initialRunId !== runId) {
          const nextUrl = new URL(window.location.href);
          nextUrl.searchParams.set("runId", initialRunId);
          window.history.replaceState({}, "", nextUrl.pathname + nextUrl.search);
        }
      })
      .catch((err) => {
        if (active) setLoadError(err.message || "Error cargando proyecto");
      });

    return () => {
      active = false;
    };
  }, [clearSessionUser, router, setSessionUser]);

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
    if (!project || !activeRunId || !appReady || typeof window.loadSeoCrawlerRun !== "function") return;

    let active = true;
    const cachedRun = runCacheRef.current.get(activeRunId);
    if (cachedRun) {
      Promise.resolve(window.loadSeoCrawlerRun(cachedRun))
        .then((hydratedRun) => {
          if (!active || !hydratedRun) return;
          runCacheRef.current.set(activeRunId, hydratedRun);
        })
        .catch((err) => {
          if (active) setLoadError(err.message || "No se pudo cargar el historial");
        });
      return () => {
        active = false;
      };
    }

    fetch(`/api/projects/${project.id}/runs/${activeRunId}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "No se pudo cargar el historial");
        return data;
      })
      .then((data) => Promise.resolve(window.loadSeoCrawlerRun(data.run)))
      .then((hydratedRun) => {
        if (!active || !hydratedRun) return;
        runCacheRef.current.set(activeRunId, hydratedRun);
      })
      .catch((err) => {
        if (active) setLoadError(err.message || "No se pudo cargar el historial");
      });

    return () => {
      active = false;
    };
  }, [activeRunId, appReady, project]);

  useEffect(() => {
    runCacheRef.current.clear();
  }, [project?.id]);

  const renameProject = async () => {
    if (!project) return;
    const nextName = window.prompt(t("promptRename"), project.name || "");
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
    const confirmed = window.confirm(t("confirmDelete"));
    if (!confirmed) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No se pudo eliminar");
      router.push("/projects");
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
        user={sessionUser}
        kicker={t("dashboardKicker")}
        title={project?.name || t("dashboardTitleFallback")}
        description={project?.targetUrl || t("dashboardDescriptionLoading")}
        actions={
          <>
            <Button href="/projects" variant="outline" tone="secondary" iconLeft={<Icon name="projects" size={15} />}>
              {t("btnProjects")}
            </Button>
            <Button type="button" variant="outline" tone="secondary" onClick={renameProject} loading={saving} iconLeft={<Icon name="edit" size={15} />}>
              {t("btnRename")}
            </Button>
            <Button type="button" variant="outline" tone="danger" onClick={deleteProject} loading={deleting} iconLeft={<Icon name="trash" size={15} />}>
              {t("btnDelete")}
            </Button>
          </>
        }
        aside={
          <div className="dashboard-aside">
            <StatCard label={t("statRuns")} value={project?.crawlRuns?.length || 0} hint={t("hintRecent")} tone="primary" icon={<Icon name="run" size={14} />} />
            <StatCard label={t("statProject")} value={project?.name || "--"} hint={t("hintActive")} tone="secondary" icon={<Icon name="projects" size={14} />} />
          </div>
        }
      >
        {project ? (
          <div className="dashboard-grid">
            <Card className="history-panel">
              <Eyebrow icon={<Icon name="history" size={12} />}>{t("historyTitle")}</Eyebrow>
              <div className="history-list">
                {project.crawlRuns?.map((run) => (
                  <button
                    type="button"
                    key={run.id}
                    className={`history-item${activeRunId === run.id ? " active" : ""}`}
                    onClick={() => openRun(run.id)}
                  >
                    <span>{formatDate(run.createdAt, lang)}</span>
                    <strong>{run.withIssues}/{run.total} {t("withIssues")}</strong>
                    <small>{run.sourceUrl}</small>
                  </button>
                ))}
                {!project.crawlRuns?.length ? <div className="history-empty">{t("noSavedHistory")}</div> : null}
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
          <Card><div className="feedback">{t("loadingDashboard")}</div></Card>
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
          .history-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 12px;
            min-width: 0;
            align-items: start;
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
            border-color: rgba(77, 141, 255, 0.62);
            background: rgba(77, 141, 255, 0.15);
            box-shadow:
              0 0 0 1px rgba(77, 141, 255, 0.5) inset,
              0 12px 24px rgba(32, 92, 179, 0.2);
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
