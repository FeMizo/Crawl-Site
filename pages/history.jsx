import Head from "next/head";
import { useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Icon from "../components/ui/Icon";

function formatDate(value) {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleString("es-MX");
}

export default function HistoryPage() {
  const [me, setMe] = useState(null);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/auth/me").then((response) => {
        if (response.status === 401) {
          window.location.href = "/login?next=/history";
          return null;
        }
        return response.json();
      }),
      fetch("/api/history").then(async (response) => {
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "No se pudo cargar el historial");
        }
        return response.json();
      }),
    ])
      .then(([meData, historyData]) => {
        if (!active) return;
        setMe(meData?.user || null);
        setRuns(historyData?.runs || []);
      })
      .catch((err) => {
        if (active) setError(err.message || "No se pudo cargar el historial");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <Head>
        <title>Historial | SEO Crawler</title>
        <link rel="stylesheet" href="/styles.css" />
      </Head>
      <AppShell
        activeKey="history"
        user={me}
        kicker="Espacio de trabajo / Historial"
        title="Historial de rastreos"
        description="Registro reciente de rastreos guardados por usuario y proyecto dentro del mismo sistema del panel."
      >
        {loading ? <p className="feedback">Cargando historial...</p> : null}
        {error ? <p className="feedback error">{error}</p> : null}
        <div className="history-grid">
          {runs.map((run) => (
            <Card key={run.id} className="history-card">
              <div className="eyebrow"><Icon name="history" size={12} /> {run.project?.name || "Proyecto"}</div>
              <h2>{run.project?.targetUrl || run.sourceUrl}</h2>
              <p>{formatDate(run.createdAt)}</p>
              <div className="history-meta">
                <span>{run.withIssues}/{run.total} con problemas</span>
                <span>{run.status}</span>
              </div>
              <Button
                href={{ pathname: "/dashboard", query: { projectId: run.projectId, runId: run.id } }}
                variant="outline"
                tone="secondary"
                size="sm"
                iconLeft={<Icon name="external" size={14} />}
              >
                Abrir rastreo
              </Button>
            </Card>
          ))}
          {!loading && !runs.length ? (
            <Card className="history-card empty">
              <div className="eyebrow">Sin historial</div>
              <h2>Todavia no hay rastreos guardados</h2>
              <p>Cuando ejecutes rastreos desde un proyecto apareceran aqui.</p>
            </Card>
          ) : null}
        </div>
        <style jsx>{`
          .feedback {
            color: var(--text2);
          }
          .feedback.error {
            color: var(--error);
          }
          .history-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 18px;
            min-width: 0;
          }
          .history-card {
            display: grid;
            gap: 14px;
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
          h2 {
            margin: 0;
            font-family: "Syne", "Manrope", sans-serif;
            font-weight: 700;
            font-size: 1.1rem;
            overflow-wrap: anywhere;
          }
          p {
            margin: 0;
            color: var(--text2);
            overflow-wrap: anywhere;
          }
          .history-meta {
            display: flex;
            justify-content: space-between;
            gap: 10px;
            color: var(--text2);
            font-size: 13px;
            flex-wrap: wrap;
          }
          .empty {
            min-height: 220px;
            align-content: center;
          }
        `}</style>
      </AppShell>
    </>
  );
}
