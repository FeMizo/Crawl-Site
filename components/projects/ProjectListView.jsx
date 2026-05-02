import React from "react";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Eyebrow from "../ui/Eyebrow";
import Icon from "../ui/Icon";

export default function ProjectListView({ projects, loading, t, lang, formatDate, deleteProject }) {
  return (
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
                      <span className="run-issues">
                        {project.lastRun.withIssues}/{project.lastRun.total} {t("hintSaved")}
                      </span>
                    </>
                  ) : (
                    <span className="muted">{t("noLastRun")}</span>
                  )}
                </td>
                <td className="cell-date">{formatDate(project.createdAt, lang, t("noDate"))}</td>
                <td>
                  <div className="row-actions">
                    <Button
                      href={{ pathname: "/dashboard", query: { projectId: project.id } }}
                      variant="outline"
                      tone="secondary"
                      size="sm"
                      iconLeft={<Icon name="external" size={14} />}
                    >
                      {t("btnOpen")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      tone="danger"
                      size="sm"
                      onClick={() => deleteProject(project.id)}
                      iconLeft={<Icon name="trash" size={14} />}
                    >
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
      <style jsx>{`
        :global(.table-card) {
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
          background: rgba(255, 255, 255, 0.02);
          white-space: nowrap;
        }
        .projects-table tbody tr:hover {
          background: rgba(77, 141, 255, 0.05);
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
      `}</style>
    </Card>
  );
}
