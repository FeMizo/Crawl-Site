import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Eyebrow from "../components/ui/Eyebrow";
import Icon from "../components/ui/Icon";
import Modal from "../components/ui/Modal";
import StatCard from "../components/ui/StatCard";
import { ProjectListSkeleton, ProjectGridSkeleton } from "../components/projects/ProjectSkeletons";
import useSessionUser from "../hooks/useSessionUser";
import { tUi, useUiLanguage } from "../lib/ui-language";
import ProjectListView from "../components/projects/ProjectListView";
import ProjectGridView from "../components/projects/ProjectGridView";

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
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [reloadKey, setReloadKey] = useState(0);
  const [freePlanModal, setFreePlanModal] = useState(false);
  const [view, setView] = useState("list");
  const initialLoadDone = useRef(false);

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
    if (!sessionUser) {
      router.replace("/login?next=/projects");
      return undefined;
    }

    let active = true;
    if (!initialLoadDone.current) {
      setLoading(true);
    }
    setFetching(true);
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
        if (active) {
          setLoading(false);
          setFetching(false);
          initialLoadDone.current = true;
        }
      });

    return () => {
      active = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, reloadKey, sessionHydrated]);

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
    
    setFetching(true);
    setError("");
    
    try {
      const response = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        throw new Error(data.error || "No se pudo eliminar el proyecto");
      }
      
      // Si es el último proyecto de la página y no es la primera página, retrocede
      if (projects.length === 1 && page > 1) {
        setPage((current) => Math.max(1, current - 1));
      } else {
        // Recarga la lista actual
        setReloadKey((current) => current + 1);
      }
    } catch (err) {
      setError(err.message);
      setFetching(false);
    }
  };

  return (
    <>
      <Head>
        <title>Proyectos | SEO Crawler</title>
        <meta name="description" content="Gestiona todos tus proyectos SEO: accede al historial de rastreos, revisa hallazgos por dominio y organiza tus auditorías." />
        <meta name="robots" content="noindex, nofollow" />
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

        {loading ? (view === "list" ? <ProjectListSkeleton /> : <ProjectGridSkeleton />) : null}
        {error ? (
          <p className="feedback error">
            <span>{error}</span>
            <button type="button" className="retry-btn" onClick={() => { setError(""); setReloadKey((k) => k + 1); }}>
              {t("retry")}
            </button>
          </p>
        ) : null}

        {view === "list" && (
          <ProjectListView
            projects={projects}
            loading={loading}
            t={t}
            lang={lang}
            formatDate={formatDate}
            deleteProject={deleteProject}
          />
        )}

        {view === "grid" && (
          <ProjectGridView
            projects={projects}
            loading={loading}
            t={t}
            lang={lang}
            formatDate={formatDate}
            deleteProject={deleteProject}
          />
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
          .free-plan-hint { margin: 0; color: var(--text2); font-size: 13px; }
        `}</style>
      </AppShell>
    </>
  );
}
