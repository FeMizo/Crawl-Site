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
import Notifications, { useNotifications } from "../components/ui/Notifications";
import DashboardSkeleton from "../components/dashboard/DashboardSkeleton";
import Skeleton from "../components/ui/Skeleton";
import useSessionUser from "../hooks/useSessionUser";
import { tUi, useUiLanguage } from "../lib/ui-language";
import HistoryPanel from "../components/dashboard/HistoryPanel";
import CrawlSchedulePanel from "../components/dashboard/CrawlSchedulePanel";
import CrawlAlertsPanel from "../components/dashboard/CrawlAlertsPanel";

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
  const { notifications, notify, dismiss } = useNotifications();
  const [schedule, setSchedule] = useState(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleError, setScheduleError] = useState("");
  const [alerts, setAlerts] = useState([]);
  const [alertsCounts, setAlertsCounts] = useState({ total: 0, unread: 0 });
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertsError, setAlertsError] = useState("");
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
    if (!sessionUser) {
      router.replace(
        `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`,
      );
      return undefined;
    }

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
        const initialRunId = runId || (projectRuns[0]?.id || "");

        setProject(projectPayload);
        setActiveRunId(initialRunId);

        if (!runId && initialRunId) {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionHydrated, retryKey]);

  const canInit = useMemo(
    () => appReady && !!markup && !!project && typeof window !== "undefined",
    [appReady, markup, project],
  );

  useEffect(() => {
    let active = true;
    fetch("/api/subscription")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d?.subscription) {
          setSubscription({
            ...d.subscription,
            crawlsThisMonth: d.usage?.crawlsThisMonth ?? 0,
            crawlsRemaining: d.limits?.crawlsRemaining ?? d.subscription.maxCrawlsPerMonth,
          });
        }
      })
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
    if (!project?.id) return undefined;

    let active = true;
    setScheduleLoading(true);
    setScheduleError("");

    fetch(`/api/projects/${project.id}/schedule`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          if (response.status === 403 && data?.error === "scheduled_crawl_required") {
            if (active) {
              setSchedule(null);
              setScheduleError("Los rastreos programados requieren un plan con esa funcion.");
            }
            return null;
          }
          throw new Error(data.error || "No se pudo cargar la programacion");
        }
        return data;
      })
      .then((data) => {
        if (!active || !data) return;
        setSchedule(data.schedule || null);
      })
      .catch((err) => {
        if (active) setScheduleError(err.message || "No se pudo cargar la programacion");
      })
      .finally(() => {
        if (active) setScheduleLoading(false);
      });

    return () => {
      active = false;
    };
  }, [project?.id, retryKey]);

  useEffect(() => {
    if (!project?.id) return undefined;

    let active = true;
    setAlertsLoading(true);
    setAlertsError("");

    fetch(`/api/projects/${project.id}/alerts?limit=8`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || "No se pudieron cargar las alertas");
        }
        return data;
      })
      .then((data) => {
        if (!active) return;
        setAlerts(Array.isArray(data.alerts) ? data.alerts : []);
        setAlertsCounts(data.counts || { total: 0, unread: 0 });
      })
      .catch((err) => {
        if (active) setAlertsError(err.message || "No se pudieron cargar las alertas");
      })
      .finally(() => {
        if (active) setAlertsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [project?.id, retryKey]);

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
      .then((data) => {
        if (!active) return null;
        return Promise.resolve(window.loadSeoCrawlerRun(data.run));
      })
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

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    window.__SEO_CRAWLER_AFTER_CRAWL__ = (nextRunId) => {
      if (!nextRunId) return;
      runCacheRef.current.clear();
      setLoadError("");
      setActiveRunId(nextRunId);
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.set("runId", nextRunId);
      window.history.replaceState({}, "", nextUrl.pathname + nextUrl.search);
      setRetryKey((current) => current + 1);
    };

    return () => {
      delete window.__SEO_CRAWLER_AFTER_CRAWL__;
    };
  }, []);

  const refreshAlerts = async () => {
    if (!project?.id) return;
    const response = await fetch(`/api/projects/${project.id}/alerts?limit=8`);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "No se pudieron cargar las alertas");
    setAlerts(Array.isArray(data.alerts) ? data.alerts : []);
    setAlertsCounts(data.counts || { total: 0, unread: 0 });
  };

  const saveSchedule = async (form) => {
    if (!project?.id) return;
    setScheduleSaving(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/schedule`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No se pudo guardar la programacion");
      setSchedule(data.schedule || null);
      notify({
        tone: "success",
        title: "Programacion guardada",
        message: "El siguiente crawl quedo actualizado.",
      });
      await refreshAlerts().catch(() => {});
    } catch (err) {
      notify({
        tone: "error",
        title: "No se pudo guardar la programacion",
        message: err.message || "Error desconocido",
      });
    } finally {
      setScheduleSaving(false);
    }
  };

  const markAlertRead = async (alertId) => {
    if (!project?.id || !alertId) return;
    try {
      const response = await fetch(`/api/projects/${project.id}/alerts/${alertId}`, {
        method: "PATCH",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No se pudo marcar como leida");
      setAlerts((current) => current.map((alert) => (alert.id === alertId ? { ...alert, readAt: data.alert?.readAt || new Date().toISOString() } : alert)));
      setAlertsCounts((current) => ({
        ...current,
        unread: Math.max(0, current.unread - 1),
      }));
    } catch (err) {
      notify({
        tone: "error",
        title: "No se pudo actualizar la alerta",
        message: err.message || "Error desconocido",
      });
    }
  };

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

  const deleteRun = async (runId) => {
    if (!project) return;
    try {
      const response = await fetch(`/api/projects/${project.id}/runs/${runId}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No se pudo eliminar");
      setProject((current) => ({
        ...current,
        crawlRuns: (current.crawlRuns || []).filter((r) => r.id !== runId),
      }));
      if (activeRunId === runId) setActiveRunId(null);
    } catch (err) {
      setLoadError(err.message || "No se pudo eliminar el historial");
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
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_APP_URL || ""}/dashboard`} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" type="image/svg+xml" href="/assets/favicon-seo-crawler.svg" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Inicio", "item": `${process.env.NEXT_PUBLIC_APP_URL || "https://crawlsite.app"}/` },
                { "@type": "ListItem", "position": 2, "name": "Proyectos", "item": `${process.env.NEXT_PUBLIC_APP_URL || "https://crawlsite.app"}/projects` },
                { "@type": "ListItem", "position": 3, "name": project?.name || "Panel", "item": `${process.env.NEXT_PUBLIC_APP_URL || "https://crawlsite.app"}/dashboard` },
              ],
            }),
          }}
        />
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
            <StatCard label={t("statRuns")} value={project?.runCount ?? project?.crawlRuns?.length ?? 0} hint={t("hintRecent")} tone="primary" icon={<Icon name="run" size={14} />} />
            <StatCard label={t("statProject")} value={project?.name || "--"} hint={t("hintActive")} tone="secondary" icon={<Icon name="projects" size={14} />} />
            <StatCard label="Programacion" value={schedule?.enabled ? "Activa" : "Pausada"} hint={schedule?.nextRunAt ? formatDate(schedule.nextRunAt, lang) : "Sin siguiente corrida"} tone="primary" icon={<Icon name="history" size={14} />} />
            <StatCard label="Alertas" value={alertsCounts.unread || 0} hint="Sin leer" tone="secondary" icon={<Icon name="shield" size={14} />} />
          </div>
        }
      >
        <Notifications items={notifications} onDismiss={dismiss} />

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
            <HistoryPanel
              project={project}
              activeRunId={activeRunId}
              openRun={openRun}
              onDeleteRun={deleteRun}
              formatDate={formatDate}
              lang={lang}
              t={t}
            />

            <CrawlSchedulePanel
              schedule={schedule}
              loading={scheduleLoading}
              saving={scheduleSaving}
              error={scheduleError}
              onSave={saveSchedule}
              formatDate={(value) => formatDate(value, lang)}
            />

            <CrawlAlertsPanel
              alerts={alerts}
              loading={alertsLoading}
              unreadCount={alertsCounts.unread || 0}
              error={alertsError}
              onRefresh={refreshAlerts}
              onMarkRead={markAlertRead}
              formatDate={formatDate}
              lang={lang}
            />

            <Card className="legacy-surface" padding="sm">
              {loadError ? (
                <div className="feedback error">
                  <span>{loadError}</span>
                  <button type="button" className="retry-btn" onClick={() => { setLoadError(""); setRetryKey((k) => k + 1); }}>
                    {t("retry")}
                  </button>
                </div>
              ) : null}
              {!appReady && !loadError && !!activeRunId ? (
                <div className="embed-skeleton" aria-label={t("loadingResults")}>
                  <div className="esk-stats">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="esk-stat-box">
                        <Skeleton width="50px" height="11px" borderRadius="4px" />
                        <Skeleton width="64px" height="26px" borderRadius="6px" />
                      </div>
                    ))}
                  </div>
                  <Skeleton width="100%" height="32px" borderRadius="6px" />
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="esk-row">
                      <Skeleton width={`${38 + (i % 3) * 8}%`} height="14px" borderRadius="4px" />
                      <Skeleton width="10%" height="14px" borderRadius="4px" />
                      <Skeleton width="10%" height="14px" borderRadius="4px" />
                      <Skeleton width="15%" height="14px" borderRadius="4px" />
                    </div>
                  ))}
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
        ) : !canInit ? (
          <DashboardSkeleton />
        ) : null}

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
            gap: 8px;
            padding: 4px 0 8px;
          }
          .esk-stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 8px;
          }
          .esk-stat-box {
            display: grid;
            gap: 8px;
            background: var(--bg3);
            border-radius: 10px;
            padding: 12px;
          }
          .esk-row {
            display: flex;
            gap: 12px;
            align-items: center;
            padding: 7px 0;
            border-top: 1px solid var(--border);
          }
          @media (max-width: 600px) {
            .esk-stats { grid-template-columns: repeat(2, 1fr); }
          }
        `}</style>
      </AppShell>
    </>
  );
}
