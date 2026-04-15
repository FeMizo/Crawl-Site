import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Eyebrow from "../components/ui/Eyebrow";
import Icon from "../components/ui/Icon";
import StatCard from "../components/ui/StatCard";
import useSessionUser from "../hooks/useSessionUser";

const DEFAULT_PAGINATION = {
  page: 1,
  limit: 8,
  total: 0,
  pageCount: 1,
  hasPrev: false,
  hasNext: false,
};

function formatDate(value) {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleString("es-MX");
}

export default function ProjectsPage() {
  const router = useRouter();
  const { sessionUser, sessionHydrated, setSessionUser, clearSessionUser } = useSessionUser();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [reloadKey, setReloadKey] = useState(0);

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

  const deleteProject = async (projectId) => {
    const confirmed = window.confirm("Esto eliminara el proyecto y su historial. Continuar?");
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
        <link rel="stylesheet" href="/styles.css" />
      </Head>
      <AppShell
        activeKey="projects"
        user={sessionUser}
        kicker="Espacio de trabajo / Proyectos"
        title="Proyectos guardados"
        description="Todos los proyectos, accesos y acciones viven dentro del mismo panel principal."
        actions={
          <Button href="/" variant="solid" tone="primary" iconLeft={<Icon name="plus" size={15} />}>
            Nuevo proyecto
          </Button>
        }
        aside={
          <div className="aside-stats">
            <StatCard label="Proyectos" value={pagination.total} hint="Espacios activos" tone="primary" icon={<Icon name="projects" size={14} />} />
            <StatCard
              label="Rastreos"
              value={projects.reduce((acc, project) => acc + (project.runCount || 0), 0)}
              hint="Pagina actual"
              tone="secondary"
              icon={<Icon name="history" size={14} />}
            />
          </div>
        }
      >
        {loading ? <p className="feedback">Cargando proyectos...</p> : null}
        {error ? <p className="feedback error">{error}</p> : null}

        <section className="grid">
          {projects.map((project) => (
            <Card key={project.id} className="project-card">
              <div className="card-top">
                <div>
                  <Eyebrow>Proyecto</Eyebrow>
                  <h2>{project.name}</h2>
                  <p>{project.targetUrl}</p>
                </div>
                <div className="card-actions">
                  <Button href={{ pathname: "/dashboard", query: { projectId: project.id } }} variant="outline" tone="secondary" size="sm" iconLeft={<Icon name="external" size={14} />}>
                    Abrir
                  </Button>
                  <Button type="button" variant="outline" tone="danger" size="sm" onClick={() => deleteProject(project.id)} iconLeft={<Icon name="trash" size={14} />}>
                    Eliminar
                  </Button>
                </div>
              </div>

              <div className="metrics">
                <StatCard label="Rastreos" value={project.runCount} hint="Guardados" tone="primary" icon={<Icon name="run" size={14} />} />
                <StatCard label="Creado" value={formatDate(project.createdAt)} hint="Fecha de alta" tone="secondary" icon={<Icon name="history" size={14} />} />
              </div>

              <Card className="last-run" padding="sm">
                <Eyebrow>Ultimo rastreo</Eyebrow>
                <strong>
                  {project.lastRun
                    ? `${formatDate(project.lastRun.createdAt)} - ${project.lastRun.withIssues}/${project.lastRun.total}`
                    : "Sin historial"}
                </strong>
              </Card>
            </Card>
          ))}
          {!loading && !projects.length ? (
            <Card className="project-card empty">
              <Eyebrow>Sin datos</Eyebrow>
              <h2>Aun no hay proyectos</h2>
              <p>Crea el primero desde la pantalla inicial y entrara directo al panel.</p>
            </Card>
          ) : null}
        </section>

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
              Anterior
            </Button>
            <span className="pagination-text">
              Pagina {pagination.page} de {pagination.pageCount}
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
              Siguiente
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
            color: var(--error);
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 18px;
            min-width: 0;
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
          .project-card {
            display: grid;
            gap: 18px;
            min-width: 0;
          }
          .card-top {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            min-width: 0;
          }
          .card-top > div:first-child {
            min-width: 0;
          }
          .card-top :global(.ui-eyebrow) {
            margin-bottom: 12px;
          }
          .card-actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            align-items: flex-start;
            justify-content: flex-end;
          }
          h2 {
            font-family: "Syne", "Manrope", sans-serif;
            font-weight: 700;
            margin: 0 0 8px;
            font-size: 1.45rem;
            overflow-wrap: anywhere;
          }
          p {
            margin: 0;
            color: var(--text2);
            word-break: break-word;
            overflow-wrap: anywhere;
          }
          .metrics {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 14px;
            min-width: 0;
          }
          .last-run strong {
            color: var(--text);
            font-size: 14px;
            overflow-wrap: anywhere;
          }
          .empty {
            align-content: center;
            min-height: 220px;
          }
          @media (max-width: 700px) {
            .card-top,
            .metrics {
              grid-template-columns: 1fr;
              display: grid;
            }
          }
        `}</style>
      </AppShell>
    </>
  );
}
