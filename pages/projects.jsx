import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Eyebrow from "../components/ui/Eyebrow";
import Icon from "../components/ui/Icon";
import Modal from "../components/ui/Modal";
import StatCard from "../components/ui/StatCard";
import useSessionUser from "../hooks/useSessionUser";
import { tUi, useUiLanguage } from "../lib/ui-language";

const VIEW_KEY = "projects_view";

const DEFAULT_PAGINATION = {
  page: 1,
  limit: 8,
  total: 0,
  pageCount: 1,
  hasPrev: false,
  hasNext: false,
};

function formatDate(value, lang, noDateLabel) {
  if (!value) return noDateLabel || "Sin fecha";
  return new Date(value).toLocaleString(lang === "en" ? "en-US" : "es-MX");
}

export default function ProjectsPage() {
  const router = useRouter();
  const lang = useUiLanguage();
  const t = (key) => tUi(lang, key);
  const { sessionUser, sessionHydrated, setSessionUser, clearSessionUser } = useSessionUser();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [reloadKey, setReloadKey] = useState(0);
  const [freePlanModal, setFreePlanModal] = useState(false);
  const [view, setView] = useState("list");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(VIEW_KEY) : null;
    if (saved === "grid" || saved === "list") setView(saved);
  }, []);

  const toggleView = (next) => {
    setView(next);
    localStorage.setItem(VIEW_KEY, next);
  };

  useEffect(() => {
    if (!sessionHydrated) return undefined;
    let active = true;
    setLoading(true);
    setError("");

    fetch(`/api/projects?page=${page}&limit=${DEFAULT_PAGINATION.limit}`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) {
          clearSessionUser();
          router.replace("/login?next=/projects");
          return null;
        }
        if (!response.ok) {
          throw new Error(data.error || "No se pudieron cargar los proyectos");
        }
        return data;
      })
      .then((projectsData) => {
        if (!active || !projectsData) return;
        setSessionUser(projectsData.viewer || null);
        setProjects(projectsData.projects || []);
        setPagination(projectsData.pagination || DEFAULT_PAGINATION);
      })
      .catch((err) => {
        if (active) setError(err.message || "No se pudieron cargar los proyectos");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [clearSessionUser, page, reloadKey, router, sessionHydrated, setSessionUser]);

  useEffect(() => {
    if (!sessionHydrated || !sessionUser) return;
    fetch("/api/subscription")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.subscription?.plan === "FREE" && d?.limits?.projectsRemaining === 0) {
          setFreePlanModal(true);
        }
      })
      .catch(() => {});
  }, [sessionHydrated, sessionUser]);

  const deleteProject = async (projectId) => {
    const confirmed = window.confirm(t("confirmDelete"));
    if (!confirmed) return;
    const response = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.error || "No se pudo eliminar el proyecto");
      return;
    }
    if (projects.length === 1 && page > 1) {
      setPage((current) => Math.max(1, current - 1));
      return;
    }
    setReloadKey((current) => current + 1);
  };

  return (
    <>
      <Head>
        <title>Proyectos | SEO Crawler</title>
        <meta name="description" content="Gestiona todos tus proyectos SEO: accede al historial de rastreos, revisa hallazgos por dominio y organiza tus auditorías." />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_APP_URL || ""}/projects`} />
      </Head>
      <AppShell
        activeKey="projects"
        user={sessionUser}
        kicker={t("projectsKicker")}
        title={t("projectsPageTitle")}
        description={t("projectsPageDesc")}
        aside={
          <div className="aside-stats">
            <StatCard label={t("statProjectsLabel")} value={pagination.total} hint={t("hintActiveSpaces")} tone="primary" icon={<Icon name="projects" size={14} />} />
            <StatCard
              label={t("statCrawlsLabel")}
              value={projects.reduce((acc, project) => acc + (project.runCount || 0), 0)}
              hint={t("hintCurrentPage")}
              tone="secondary"
              icon={<Icon name="history" size={14} />}
            />
          </div>
        }
      >
        <div className="content-bar">
          <Button href="/" variant="solid" tone="primary" iconLeft={<Icon name="plus" size={15} />}>
            {t("btnNewProject")}
          </Button>
          <div className="view-toggle">
            <button
              type="button"
              className={`view-btn${view === "list" ? " on" : ""}`}
              onClick={() => toggleView("list")}
              aria-label="Vista lista"
            >
              <Icon name="list" size={15} />
            </button>
            <button
              type="button"
              className={`view-btn${view === "grid" ? " on" : ""}`}
              onClick={() => toggleView("grid")}
              aria-label="Vista cuadrícula"
            >
              <Icon name="grid" size={15} />
            </button>
          </div>
        </div>

        {loading ? <p className="feedback">{t("loadingProjects")}</p> : null}
        {error ? (
          <p className="feedback error">
            <span>{error}</span>
            <button type="button" className="retry-btn" onClick={() => { setError(""); setReloadKey((k) => k + 1); }}>
              {t("retry")}
            </button>
          </p>
        ) : null}

        {view === "list" && (
          <Card className="table-card" padding="sm">
            <div className="table-wrap">
              <table className="projects-table">
                <thead>
                  <tr>
                    <th>{t("eyebrowProject")}</th>
                    <th>{t("statCrawlsLabel")}</th>
                    <th>{t("eyebrowLastRun")}</th>
                    <th>{t("statCreatedLabel")}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr key={project.id}>
                      <td>
                        <div className="cell-name">
                          <strong>{project.name}</strong>
                          <span>{project.targetUrl}</span>
                        </div>
                      </td>
                      <td className="cell-num">{project.runCount ?? 0}</td>
                      <td className="cell-run">
                        {project.lastRun ? (
                          <>
                            <span>{formatDate(project.lastRun.createdAt, lang, t("noDate"))}</span>
                            <span className="run-issues">{project.lastRun.withIssues}/{project.lastRun.total} {t("hintSaved")}</span>
                          </>
                        ) : (
                          <span className="muted">{t("noLastRun")}</span>
                        )}
                      </td>
                      <td className="cell-date">{formatDate(project.createdAt, lang, t("noDate"))}</td>
                      <td>
                        <div className="row-actions">
                          <Button href={{ pathname: "/dashboard", query: { projectId: project.id } }} variant="outline" tone="secondary" size="sm" iconLeft={<Icon name="external" size={14} />}>
                            {t("btnOpen")}
                          </Button>
                          <Button type="button" variant="outline" tone="danger" size="sm" onClick={() => deleteProject(project.id)} iconLeft={<Icon name="trash" size={14} />}>
                            {t("btnDelete")}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!loading && !projects.length ? (
                    <tr>
                      <td colSpan={5}>
                        <div className="empty-state">
                          <Eyebrow>{t("noProjectsEyebrow")}</Eyebrow>
                          <strong>{t("noProjectsTitle")}</strong>
                          <span>{t("noProjectsDesc")}</span>
                          <Button href="/" variant="solid" tone="primary" iconLeft={<Icon name="plus" size={15} />}>
                            {t("noProjectsCtaFirst")}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {view === "grid" && (
          <>
            {!loading && !projects.length ? (
              <div className="empty-state">
                <Eyebrow>{t("noProjectsEyebrow")}</Eyebrow>
                <strong>{t("noProjectsTitle")}</strong>
                <span>{t("noProjectsDesc")}</span>
                <Button href="/" variant="solid" tone="primary" iconLeft={<Icon name="plus" size={15} />}>
                  {t("noProjectsCtaFirst")}
                </Button>
              </div>
            ) : (
              <div className="grid-view">
                {projects.map((project) => (
                  <div key={project.id} className="grid-card">
                    <a href={`/dashboard?projectId=${project.id}`} className="gc-link">
                      <div className="gc-top">
                        <div className="gc-avatar">{(project.name || "P")[0].toUpperCase()}</div>
                        <div className="gc-identity">
                          <strong className="gc-name">{project.name}</strong>
                          <span className="gc-url">{project.targetUrl.replace(/^https?:\/\//, "")}</span>
                        </div>
                      </div>
                      <div className="gc-stats">
                        <div className="gc-stat">
                          <span className="gc-stat-val">{project.runCount ?? 0}</span>
                          <span className="gc-stat-lbl">{t("statCrawlsLabel")}</span>
                        </div>
                        {project.lastRun ? (
                          <>
                            <div className="gc-stat-sep" />
                            <div className="gc-stat">
                              <span className={`gc-stat-val${project.lastRun.withIssues > 0 ? " has-issues" : " no-issues"}`}>
                                {project.lastRun.withIssues}
                              </span>
                              <span className="gc-stat-lbl">Issues</span>
                            </div>
                            <div className="gc-stat-sep" />
                            <div className="gc-stat">
                              <span className="gc-stat-val">{project.lastRun.total}</span>
                              <span className="gc-stat-lbl">{lang === "en" ? "Pages" : "Páginas"}</span>
                            </div>
                          </>
                        ) : (
                          <span className="gc-no-run">{t("noLastRun")}</span>
                        )}
                      </div>
                    </a>
                    <div className="gc-footer">
                      <span className="gc-date">{formatDate(project.createdAt, lang, t("noDate"))}</span>
                      <button
                        type="button"
                        className="btn btn-danger gc-del-btn"
                        onClick={() => deleteProject(project.id)}
                        aria-label={t("btnDelete")}
                      >
                        <Icon name="trash" size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {freePlanModal && (
          <Modal
            title="Estas en el plan Gratis"
            onClose={() => setFreePlanModal(false)}
            actions={
              <>
                <Button variant="outline" tone="secondary" onClick={() => setFreePlanModal(false)}>
                  Entendido
                </Button>
                <Button href="/subscription" variant="solid" tone="primary" iconLeft={<Icon name="plus" size={15} />}>
                  Ver planes
                </Button>
              </>
            }
          >
            <div className="free-plan-body">
              <p className="free-plan-msg">
                Usaste todos los proyectos disponibles en el plan Gratis.
              </p>
              <p className="free-plan-hint">
                En el plan Gratis los proyectos eliminados no liberan espacio. Actualiza tu plan para seguir creando proyectos.
              </p>
            </div>
          </Modal>
        )}

        {!loading && pagination.pageCount > 1 ? (
          <div className="pagination-row">
            <Button
              type="button"
              variant="outline"
              tone="secondary"
              size="sm"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={!pagination.hasPrev}
            >
              {t("paginationPrev")}
            </Button>
            <span className="pagination-text">
              {t("paginationPage")} {pagination.page} {t("paginationOf")} {pagination.pageCount}
            </span>
            <Button
              type="button"
              variant="outline"
              tone="secondary"
              size="sm"
              onClick={() =>
                setPage((current) => Math.min(pagination.pageCount, current + 1))
              }
              disabled={!pagination.hasNext}
            >
              {t("paginationNext")}
            </Button>
          </div>
        ) : null}

        <style jsx>{`
          .aside-stats {
            display: grid;
            gap: 12px;
          }
          .content-bar {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 8px;
          }
          .view-toggle {
            display: flex;
            align-items: center;
            background: var(--bg3);
            border: 1px solid var(--border2);
            border-radius: 10px;
            padding: 3px;
            gap: 2px;
          }
          .view-btn {
            display: grid;
            place-items: center;
            width: 30px;
            height: 30px;
            border: none;
            border-radius: 7px;
            background: transparent;
            color: var(--text3);
            cursor: pointer;
            transition: background 0.15s, color 0.15s;
          }
          .view-btn:hover {
            background: var(--bg2);
            color: var(--text2);
          }
          .view-btn.on {
            background: var(--adim);
            color: var(--accent);
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
          .table-card {
            min-width: 0;
          }
          .table-wrap {
            overflow-x: auto;
          }
          .projects-table {
            width: 100%;
            border-collapse: collapse;
            min-width: 680px;
          }
          .projects-table th,
          .projects-table td {
            text-align: left;
            padding: 12px 14px;
            border-bottom: 1px solid var(--border);
            vertical-align: middle;
          }
          .projects-table th {
            color: var(--muted);
            font-size: 11px;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            background: rgba(255,255,255,0.02);
            white-space: nowrap;
          }
          .projects-table tbody tr:hover {
            background: rgba(77,141,255,0.05);
          }
          .projects-table tbody tr:last-child td {
            border-bottom: none;
          }
          .cell-name {
            display: grid;
            gap: 3px;
          }
          .cell-name strong {
            font-size: 14px;
          }
          .cell-name span,
          .cell-date,
          .run-issues,
          .muted {
            color: var(--text2);
            font-size: 12px;
          }
          .cell-run {
            display: grid;
            gap: 2px;
          }
          .cell-run span {
            font-size: 13px;
          }
          .cell-num {
            font-size: 15px;
            font-weight: 700;
            color: var(--text);
          }
          .row-actions {
            display: flex;
            gap: 8px;
            justify-content: flex-end;
            flex-wrap: nowrap;
          }
          .empty-state {
            display: grid;
            gap: 10px;
            padding: 32px 16px;
            text-align: center;
            justify-items: center;
          }
          .empty-state strong {
            font-size: 16px;
          }
          .empty-state span {
            color: var(--text2);
            font-size: 13px;
          }
          .pagination-row {
            display: flex;
            gap: 12px;
            align-items: center;
            justify-content: flex-end;
            flex-wrap: wrap;
          }
          .pagination-text {
            color: var(--text2);
            font-size: 13px;
          }
          .free-plan-body { display: grid; gap: 10px; }
          .free-plan-msg { margin: 0; color: var(--text); font-size: 14px; }
          .free-plan-hint { margin: 0; color: var(--text2); font-size: 13px; }
          .grid-view {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
          }
          @media (max-width: 1100px) {
            .grid-view { grid-template-columns: repeat(2, 1fr); }
          }
          @media (max-width: 600px) {
            .grid-view { grid-template-columns: 1fr; }
          }
          .grid-card {
            background: var(--bg2);
            border: 1px solid var(--border2);
            border-radius: 16px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transition: border-color 0.18s, box-shadow 0.18s;
          }
          .grid-card:hover {
            border-color: var(--accent);
            box-shadow: 0 0 0 1px var(--adim), 0 8px 24px rgba(0,0,0,0.2);
          }
          .gc-link {
            display: flex;
            flex-direction: column;
            gap: 14px;
            padding: 18px 18px 14px;
            text-decoration: none;
            color: inherit;
            flex: 1;
          }
          .gc-top {
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 0;
          }
          .gc-avatar {
            flex: 0 0 auto;
            width: 40px;
            height: 40px;
            border-radius: 12px;
            background: var(--adim);
            border: 1px solid var(--accent);
            color: var(--accent);
            display: grid;
            place-items: center;
            font-size: 17px;
            font-weight: 900;
            font-family: "Syne", sans-serif;
            letter-spacing: -0.02em;
          }
          .gc-identity {
            display: grid;
            gap: 3px;
            min-width: 0;
          }
          .gc-name {
            font-size: 15px;
            font-weight: 800;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            color: var(--text);
            line-height: 1.2;
          }
          .gc-url {
            font-size: 11px;
            color: var(--text3);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .gc-stats {
            display: flex;
            align-items: center;
            gap: 0;
            background: var(--bg3);
            border-radius: 10px;
            padding: 10px 14px;
          }
          .gc-stat {
            display: flex;
            flex-direction: column;
            gap: 2px;
            flex: 1;
            min-width: 0;
          }
          .gc-stat-val {
            font-size: 18px;
            font-weight: 900;
            font-family: "Syne", sans-serif;
            color: var(--text);
            line-height: 1;
          }
          .gc-stat-val.has-issues {
            color: var(--error);
          }
          .gc-stat-val.no-issues {
            color: var(--accent);
          }
          .gc-stat-lbl {
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: var(--text3);
          }
          .gc-stat-sep {
            width: 1px;
            height: 28px;
            background: var(--border2);
            flex: 0 0 auto;
            margin: 0 12px;
          }
          .gc-no-run {
            font-size: 12px;
            color: var(--text3);
            margin-left: auto;
          }
          .gc-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 18px 14px;
            border-top: 1px solid var(--border2);
          }
          .gc-date {
            font-size: 11px;
            color: var(--text3);
          }
          .gc-del-btn {
            display: grid;
            place-items: center;
            width: 28px;
            height: 28px;
            border-radius: 8px;
            border: none;
            background: transparent;
            color: var(--text3);
            cursor: pointer;
            transition: background 0.15s, color 0.15s;
          }
          .gc-del-btn:hover {
            background: var(--edim, rgba(255,82,82,0.12));
            color: var(--error);
          }
        `}</style>
      </AppShell>
    </>
  );
}
