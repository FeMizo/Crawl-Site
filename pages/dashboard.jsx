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
  const { sessionUser, sessionHydrated, setSessionUser, clearSessionUser } = useSessionUser();
  const [markup, setMarkup] = useState(() => legacyMarkupCache);
  const [loadError, setLoadError] = useState("");
  const [appReady, setAppReady] = useState(false);
  const [project, setProject] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [editingName, setEditingName] = useState(null);
  const [retryKey, setRetryKey] = useState(0);
  const [activeRunId, setActiveRunId] = useState("");
  const [subscription, setSubscription] = useState(null);
  const runCacheRef = useRef(new Map());

  useEffect(() => {
    if (typeof window.initSeoCrawlerApp === "function") {
      setAppReady(true);
    }
  }, []);

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
    if (!sessionHydrated) return undefined;
    let active = true;
    setLoadError("");
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
  }, [clearSessionUser, router, sessionHydrated, setSessionUser, retryKey]);

  const canInit = useMemo(
    () => appReady && !!markup && !!project && typeof window !== "undefined",
    [appReady, markup, project],
  );

  useEffect(() => {
    let active = true;
    fetch("/api/subscription")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (active && d?.subscription) setSubscription(d.subscription); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!subscription) return;
    const features = subscription.features || [];
    document.body.classList.toggle("feature-locked-excel", !features.includes("excel_report"));
    return () => { document.body.classList.remove("feature-locked-excel"); };
  }, [subscription]);

  useEffect(() => {
    if (!canInit || typeof window.initSeoCrawlerApp !== "function") return;
    window.__SEO_CRAWLER_PROJECT__ = project;
    window.__SEO_CRAWLER_SUBSCRIPTION__ = subscription;
    window.initSeoCrawlerApp();
  }, [canInit, project, subscription]);

  useEffect(() => {
    if (!project || !activeRunId || !appReady || !markup || typeof window.loadSeoCrawlerRun !== "function") return;

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
  }, [activeRunId, appReady, project, markup]);

  useEffect(() => {
    runCacheRef.current.clear();
  }, [project?.id]);

  const renameProject = () => {
    if (!project) return;
    setEditingName(project.name || "");
  };

  const saveRename = async () => {
    if (!project || editingName === null) return;
    const nextName = editingName.trim();
    if (!nextName || nextName === project.name) {
      setEditingName(null);
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nextName, targetUrl: project.targetUrl }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo renombrar");
      setProject((current) => ({ ...current, ...data.project }));
      setEditingName(null);
    } catch (err) {
      setLoadError(err.message || "No se pudo renombrar");
    } finally {
      setSaving(false);
    }
  };

  const deleteProject = async () => {
    if (!project) return;
    setPendingDelete(false);
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
        <title>Panel | SEO Crawler</title>
        <meta name="description" content="Lanza y monitorea rastreos SEO, revisa errores detectados y analiza el estado de tu sitio web desde el panel de control." />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_APP_URL || ""}/dashboard`} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" type="image/svg+xml" href="/assets/favicon-seo-crawler.svg" />
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
            <Button type="button" variant="outline" tone="danger" onClick={() => setPendingDelete(true)} loading={deleting} iconLeft={<Icon name="trash" size={15} />}>
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
        {pendingDelete ? (
          <Card className="confirm-banner">
            <div className="confirm-banner-body">
              <div>
                <strong>{t("confirmDeleteTitle")}</strong>
                <p>{t("confirmDeleteWarning")}</p>
              </div>
              <div className="confirm-banner-actions">
                <Button type="button" variant="outline" tone="secondary" size="sm" onClick={() => setPendingDelete(false)}>
                  {t("btnCancel")}
                </Button>
                <Button type="button" variant="solid" tone="danger" size="sm" onClick={deleteProject} loading={deleting} iconLeft={<Icon name="trash" size={14} />}>
                  {t("btnConfirmDelete")}
                </Button>
              </div>
            </div>
          </Card>
        ) : null}

        {editingName !== null ? (
          <Card className="rename-banner">
            <div className="rename-banner-body">
              <label className="ui-field-label" htmlFor="rename-input">{t("renameLabel")}</label>
              <input
                id="rename-input"
                className="ui-input rename-input"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveRename();
                  if (e.key === "Escape") setEditingName(null);
                }}
                autoFocus
              />
              <div className="rename-banner-actions">
                <Button type="button" variant="outline" tone="secondary" size="sm" onClick={() => setEditingName(null)}>
                  {t("btnCancel")}
                </Button>
                <Button type="button" variant="solid" tone="primary" size="sm" onClick={saveRename} loading={saving}>
                  {t("saveRename")}
                </Button>
              </div>
            </div>
          </Card>
        ) : null}

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
                    <strong>{run.withIssues} {t("issuesLabel")} · {run.total} {t("pagesLabel")}</strong>
                    <small>{run.sourceUrl}</small>
                  </button>
                ))}
                {!project.crawlRuns?.length ? <div className="history-empty">{t("noSavedHistory")}</div> : null}
              </div>
            </Card>

            <Card className="legacy-surface" padding="sm">
              {loadError ? (
                <div className="feedback error">
                  <span>{loadError}</span>
                  <button type="button" className="retry-btn" onClick={() => { setLoadError(""); setRetryKey((k) => k + 1); }}>
                    {t("retry")}
                  </button>
                </div>
              ) : null}
              {!appReady && !loadError ? (
                <div className="embed-skeleton" aria-label={t("loadingResults")}>
                  <div className="sk-block sk-title" />
                  <div className="sk-block sk-wide" />
                  <div className="sk-block sk-wide" />
                  <div className="sk-row">
                    <div className="sk-block sk-cell" />
                    <div className="sk-block sk-cell" />
                    <div className="sk-block sk-cell" />
                  </div>
                  <div className="sk-block sk-wide" />
                  <div className="sk-block sk-medium" />
                </div>
              ) : null}
              <div className="legacy-embed" dangerouslySetInnerHTML={{ __html: markup }} />
            </Card>
          </div>
        ) : loadError ? (
          <Card>
            <div className="feedback error">
              <span>{loadError}</span>
              <button type="button" className="retry-btn" onClick={() => { setLoadError(""); setRetryKey((k) => k + 1); }}>
                {t("retry")}
              </button>
            </div>
          </Card>
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
          @keyframes sk-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.35; }
          }
          .sk-block {
            animation: sk-pulse 1.5s ease-in-out infinite;
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
            font-family: "Manrope", sans-serif;
            transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
          }
          .history-item span {
            font-size: 11px;
            color: var(--muted);
          }
          .history-item strong {
            font-size: 16px;
            font-weight: 700;
            color: var(--text);
            font-variant-numeric: tabular-nums;
            letter-spacing: -0.01em;
          }
          .history-item small {
            font-size: 11px;
            display: block;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            color: var(--muted);
          }
          .history-item:hover {
            border-color: var(--border2);
          }
          .history-item:focus-visible {
            outline: 2px solid rgba(77, 141, 255, 0.8);
            outline-offset: -2px;
          }
          .history-item.active {
            border-color: rgba(77, 141, 255, 0.62);
            background: rgba(77, 141, 255, 0.15);
            box-shadow:
              0 0 0 1px rgba(77, 141, 255, 0.5) inset,
              0 12px 24px rgba(32, 92, 179, 0.2);
          }
          .history-empty {
            color: var(--muted);
          }
          .legacy-surface {
            overflow: hidden;
            min-width: 0;
          }
          .feedback {
            color: var(--text2);
          }
          .feedback.error {
            display: flex;
            align-items: center;
            gap: 12px;
            color: var(--error);
          }
          .retry-btn {
            background: transparent;
            border: 1px solid var(--error);
            border-radius: 8px;
            color: var(--error);
            font-family: "Manrope", sans-serif;
            font-size: 12px;
            font-weight: 700;
            padding: 4px 10px;
            cursor: pointer;
            flex: 0 0 auto;
            transition: background 0.15s ease;
          }
          .retry-btn:hover {
            background: var(--edim);
          }
          .confirm-banner {
            background: var(--edim) !important;
            border-color: rgba(255, 82, 82, 0.3) !important;
          }
          .confirm-banner-body {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            flex-wrap: wrap;
          }
          .confirm-banner-body strong {
            display: block;
            font-size: 14px;
            color: var(--text);
            margin-bottom: 4px;
          }
          .confirm-banner-body p {
            margin: 0;
            font-size: 13px;
            color: var(--error);
          }
          .confirm-banner-actions {
            display: flex;
            gap: 8px;
            flex: 0 0 auto;
          }
          .rename-banner-body {
            display: grid;
            gap: 10px;
          }
          .rename-input {
            max-width: 420px;
          }
          .rename-banner-actions {
            display: flex;
            gap: 8px;
          }
          .embed-skeleton {
            display: grid;
            gap: 10px;
            padding: 4px 0 8px;
          }
          .sk-block {
            background: var(--bg3);
            border-radius: 8px;
            height: 18px;
          }
          .sk-title { height: 24px; width: 40%; }
          .sk-wide { width: 100%; }
          .sk-medium { width: 65%; }
          .sk-row {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
          }
          .sk-cell { height: 48px; }
        `}</style>
      </AppShell>
    </>
  );
}
