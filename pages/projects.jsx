import Head from "next/head";
import { useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Icon from "../components/ui/Icon";
import StatCard from "../components/ui/StatCard";

function formatDate(value) {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleString("es-MX");
}

export default function ProjectsPage() {
  const [me, setMe] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/auth/me").then((response) => {
        if (response.status === 401) {
          window.location.href = "/login?next=/projects";
          return null;
        }
        return response.json();
      }),
      fetch("/api/projects").then(async (response) => {
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "No se pudieron cargar los proyectos");
        }
        return response.json();
      }),
    ])
      .then(([meData, projectsData]) => {
        if (!active) return;
        setMe(meData?.user || null);
        setProjects(projectsData?.projects || []);
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
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const deleteProject = async (projectId) => {
    const confirmed = window.confirm("Esto eliminara el proyecto y su historial. Continuar?");
    if (!confirmed) return;
    const response = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.error || "No se pudo eliminar el proyecto");
      return;
    }
    setProjects((current) => current.filter((project) => project.id !== projectId));
  };

  return (
    <>
      <Head>
        <title>Proyectos | SEO Crawler</title>
        <link rel="stylesheet" href="/styles.css" />
      </Head>
      <AppShell
        activeKey="projects"
        user={me}
        kicker="Espacio de trabajo / Proyectos"
        title="Proyectos guardados"
        description="Todas las tarjetas, acciones y grids viven dentro del mismo layout base del panel principal."
        actions={
          <>
            <Button href="/" variant="solid" tone="primary" iconLeft={<Icon name="plus" size={15} />}>
              Nuevo proyecto
            </Button>
            <Button type="button" onClick={logout} variant="outline" tone="secondary" iconLeft={<Icon name="login" size={15} />}>
              Cerrar sesion
            </Button>
          </>
        }
        aside={
          <div className="aside-stats">
            <StatCard label="Proyectos" value={projects.length} hint="Espacios activos" tone="primary" icon={<Icon name="projects" size={14} />} />
            <StatCard
              label="Rastreos"
              value={projects.reduce((acc, project) => acc + (project.runCount || 0), 0)}
              hint="Historial total"
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
                  <div className="eyebrow">Proyecto</div>
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
                <div className="eyebrow">Ultimo rastreo</div>
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
              <div className="eyebrow">Sin datos</div>
              <h2>Aun no hay proyectos</h2>
              <p>Crea el primero desde la pantalla inicial y entrara directo al panel.</p>
            </Card>
          ) : null}
        </section>

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
          .project-card {
            display: grid;
            gap: 18px;
            min-width: 0;
            margin-top: 10px;
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
          .card-actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            align-items: flex-start;
            justify-content: flex-end;
          }
          .eyebrow {
            color: var(--muted);
            font-size: 11px;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            margin-bottom: 12px;
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
          .last-run {
            margin-top: 6px;
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
