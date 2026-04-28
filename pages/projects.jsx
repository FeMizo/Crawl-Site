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
        actions={
          <Button href="/" variant="solid" tone="primary" iconLeft={<Icon name="plus" size={15} />}>
            {t("btnNewProject")}
          </Button>
        }
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
        {loading ? <p className="feedback">{t("loadingProjects")}</p> : null}
        {error ? (
          <p className="feedback error">
            <span>{error}</span>
            <button type="button" className="retry-btn" onClick={() => { setError(""); setReloadKey((k) => k + 1); }}>
              {t("retry")}
            </button>
          </p>
        ) : null}

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
        `}</style>
      </AppShell>
    </>
  );
}
