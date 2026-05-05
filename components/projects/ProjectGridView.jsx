import React from "react";
import Button from "../ui/Button";
import Eyebrow from "../ui/Eyebrow";
import Icon from "../ui/Icon";

export default function ProjectGridView({ projects, loading, t, lang, formatDate, deleteProject }) {
  if (!loading && !projects.length) {
    return (
      <div className="empty-state">
        <Eyebrow>{t("noProjectsEyebrow")}</Eyebrow>
        <strong>{t("noProjectsTitle")}</strong>
        <span>{t("noProjectsDesc")}</span>
        <Button href="/" variant="solid" tone="primary" iconLeft={<Icon name="plus" size={15} />}>
          {t("noProjectsCtaFirst")}
        </Button>
        <style jsx>{`
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
        `}</style>
      </div>
    );
  }

  return (
    <div className="grid-view">
      {projects.map((project) => {
        const hasRun = !!project.lastRun;
        const issues = project.lastRun?.withIssues ?? 0;
        const total = project.lastRun?.total ?? 0;
        const healthPct = hasRun && total > 0 ? Math.round(((total - issues) / total) * 100) : null;
        const healthStatus = !hasRun ? "none" : issues === 0 ? "ok" : issues / total > 0.3 ? "bad" : "warn";
        const healthLabel = { none: lang === "en" ? "Not crawled" : "Sin rastreo", ok: lang === "en" ? "Healthy" : "Saludable", warn: lang === "en" ? "Warnings" : "Advertencias", bad: lang === "en" ? "Issues" : "Con errores" }[healthStatus];

        return (
          <div key={project.id} className="grid-card">
            <a href={`/dashboard?projectId=${project.id}`} className="gc-link">
              <div className="gc-top">
                <div className="gc-avatar">{(project.name || "P")[0].toUpperCase()}</div>
                <div className="gc-identity">
                  <strong className="gc-name">{project.name}</strong>
                  <span className="gc-url">{project.targetUrl.replace(/^https?:\/\//, "")}</span>
                </div>
                <span className={`health-badge health-${healthStatus}`}>{healthLabel}</span>
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
              {healthPct !== null && (
                <div className="gc-health-bar">
                  <div className="gc-health-track">
                    <div className={`gc-health-fill health-fill-${healthStatus}`} style={{ width: `${healthPct}%` }} />
                  </div>
                  <span className="gc-health-pct">{healthPct}% {lang === "en" ? "OK" : "sin errores"}</span>
                </div>
              )}
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
        );
      })}
      <style jsx>{`
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
          box-shadow: 0 0 0 1px var(--adim), 0 8px 24px rgba(0, 0, 0, 0.2);
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
          flex: 1;
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
          font-size: 13px;
          color: var(--text3);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        /* Health Badge */
        .health-badge {
          flex: 0 0 auto;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 20px;
          border: 1px solid;
          white-space: nowrap;
          align-self: flex-start;
          margin-top: 2px;
        }
        .health-none {
          background: rgba(150,150,170,0.08);
          border-color: rgba(150,150,170,0.2);
          color: var(--text3);
        }
        .health-ok {
          background: rgba(34,197,94,0.1);
          border-color: rgba(34,197,94,0.3);
          color: #4ade80;
        }
        .health-warn {
          background: rgba(234,179,8,0.1);
          border-color: rgba(234,179,8,0.3);
          color: #facc15;
        }
        .health-bad {
          background: rgba(239,68,68,0.1);
          border-color: rgba(239,68,68,0.3);
          color: var(--error);
        }
        /* Health Progress Bar */
        .gc-health-bar {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .gc-health-track {
          flex: 1;
          height: 4px;
          background: var(--bg3);
          border-radius: 99px;
          overflow: hidden;
        }
        .gc-health-fill {
          height: 100%;
          border-radius: 99px;
          transition: width 0.5s ease;
        }
        .health-fill-ok  { background: #4ade80; }
        .health-fill-warn { background: #facc15; }
        .health-fill-bad  { background: var(--error); }
        .gc-health-pct {
          font-size: 10px;
          color: var(--text3);
          white-space: nowrap;
          flex: 0 0 auto;
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
          font-size: 13px;
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
          background: var(--edim, rgba(255, 82, 82, 0.12));
          color: var(--error);
        }
      `}</style>
    </div>
  );
}
