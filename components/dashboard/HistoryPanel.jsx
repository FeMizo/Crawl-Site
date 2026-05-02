import React from "react";
import Card from "../ui/Card";
import Eyebrow from "../ui/Eyebrow";
import Icon from "../ui/Icon";

export default function HistoryPanel({ project, activeRunId, openRun, formatDate, lang, t }) {
  return (
    <Card className="history-panel">
      <Eyebrow icon={<Icon name="history" size={12} />}>{t("historyTitle")}</Eyebrow>
      <div className="history-list">
        {project.crawlRuns?.map((run) => (
          <button
            type="button"
            key={run.id}
            className={`history-item${activeRunId === run.id ? " active" : ""}`}
            onClick={() => openRun(run.id)}
          >
            <span>{formatDate(run.createdAt, lang)}</span>
            <strong>
              {run.withIssues} {t("issuesLabel")} · {run.total} {t("pagesLabel")}
            </strong>
            <small>{run.sourceUrl}</small>
          </button>
        ))}
        {!project.crawlRuns?.length ? <div className="history-empty">{t("noSavedHistory")}</div> : null}
      </div>
      <style jsx>{`
        :global(.history-panel) {
          display: grid;
          gap: 16px;
          min-width: 0;
        }
        .history-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
          min-width: 0;
          align-items: start;
        }
        .history-item,
        .history-empty {
          border: 1px solid var(--border);
          border-radius: 16px;
          background: var(--bg);
          padding: 16px;
          text-align: left;
          color: var(--text);
          min-width: 0;
          overflow: hidden;
        }
        .history-item {
          cursor: pointer;
          display: grid;
          gap: 6px;
          font-family: "Manrope", sans-serif;
          transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
        }
        .history-item span {
          font-size: 11px;
          color: var(--muted);
        }
        .history-item strong {
          font-size: 16px;
          font-weight: 700;
          color: var(--text);
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.01em;
        }
        .history-item small {
          font-size: 11px;
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: var(--muted);
        }
        .history-item:hover {
          border-color: var(--border2);
        }
        .history-item:focus-visible {
          outline: 2px solid rgba(77, 141, 255, 0.8);
          outline-offset: -2px;
        }
        .history-item.active {
          border-color: rgba(77, 141, 255, 0.62);
          background: rgba(77, 141, 255, 0.15);
          box-shadow: 0 0 0 1px rgba(77, 141, 255, 0.5) inset, 0 12px 24px rgba(32, 92, 179, 0.2);
        }
        .history-empty {
          color: var(--muted);
        }
      `}</style>
    </Card>
  );
}
