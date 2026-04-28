import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Eyebrow from "../components/ui/Eyebrow";
import Icon from "../components/ui/Icon";
import useSessionUser from "../hooks/useSessionUser";
import { tUi, useUiLanguage } from "../lib/ui-language";

const DEFAULT_PAGINATION = {
  page: 1,
  limit: 12,
  total: 0,
  pageCount: 1,
  hasPrev: false,
  hasNext: false,
};

function formatDate(value, lang, noDateLabel) {
  if (!value) return noDateLabel || "Sin fecha";
  return new Date(value).toLocaleString(lang === "en" ? "en-US" : "es-MX");
}

export default function HistoryPage() {
  const router = useRouter();
  const lang = useUiLanguage();
  const t = (key) => tUi(lang, key);
  const { sessionUser, setSessionUser, clearSessionUser } = useSessionUser();
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    fetch(`/api/history?page=${page}&limit=${DEFAULT_PAGINATION.limit}`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) {
          clearSessionUser();
          router.replace("/login?next=/history");
          return null;
        }
        if (!response.ok) {
          throw new Error(data.error || "No se pudo cargar el historial");
        }
        return data;
      })
      .then((historyData) => {
        if (!active || !historyData) return;
        setSessionUser(historyData.viewer || null);
        setRuns(historyData.runs || []);
        setPagination(historyData.pagination || DEFAULT_PAGINATION);
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
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Head>
        <title>Historial | SEO Crawler</title>
        <meta name="description" content="Consulta el historial completo de rastreos SEO por proyecto: compara ejecuciones, revisa errores pasados y descarga reportes." />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_APP_URL || ""}/history`} />
      </Head>
      <AppShell
        activeKey="history"
        user={sessionUser}
        kicker={t("historyKicker")}
        title={t("historyPageTitle")}
        description={t("historyPageDesc")}
      >
        {loading ? <p className="feedback">{t("loadingHistory")}</p> : null}
        {error ? <p className="feedback error">{error}</p> : null}
        <div className="history-grid">
          {runs.map((run) => (
            <Card key={run.id} className="history-card">
              <Eyebrow icon={<Icon name="history" size={12} />}>{run.project?.name || t("defaultProjectName")}</Eyebrow>
              <h2>{run.project?.targetUrl || run.sourceUrl}</h2>
              <p>{formatDate(run.createdAt, lang, t("noDate"))}</p>
              <div className="history-meta">
                <span>{run.withIssues}/{run.total} {t("withIssues")}</span>
                <span>{run.status}</span>
              </div>
              <Button
                href={{ pathname: "/dashboard", query: { projectId: run.projectId, runId: run.id } }}
                variant="outline"
                tone="secondary"
                size="sm"
                iconLeft={<Icon name="external" size={14} />}
              >
                {t("openCrawl")}
              </Button>
            </Card>
          ))}
          {!loading && !runs.length ? (
            <Card className="history-card empty">
              <Eyebrow>{t("noHistoryEyebrow")}</Eyebrow>
              <h2>{t("noSavedCrawls")}</h2>
              <p>{t("noSavedCrawlsDesc")}</p>
            </Card>
          ) : null}
        </div>
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
            align-items: start;
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
          .history-card {
            display: grid;
            gap: 14px;
            min-width: 0;
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
