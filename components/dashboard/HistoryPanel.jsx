import React, { useState } from "react";
import Card from "../ui/Card";
import Eyebrow from "../ui/Eyebrow";
import Icon from "../ui/Icon";

const PAGE_SIZE = 5;

export default function HistoryPanel({ project, activeRunId, openRun, onDeleteRun, formatDate, lang, t }) {
  const [showAll, setShowAll] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const allRuns = Array.isArray(project.crawlRuns) ? project.crawlRuns : [];
  const runs = showAll ? allRuns : allRuns.slice(0, PAGE_SIZE);
  const hasMore = allRuns.length > PAGE_SIZE;

  const handleDelete = async (e, runId) => {
    e.stopPropagation();
    if (confirmId !== runId) {
      setConfirmId(runId);
      return;
    }
    setConfirmId(null);
    setDeletingId(runId);
    try {
      await onDeleteRun(runId);
    } finally {
      setDeletingId(null);
    }
  };

  const cancelConfirm = (e) => {
    e.stopPropagation();
    setConfirmId(null);
  };

  return (
    <Card className="history-panel">
      <div className="history-panel-hd">
        <Eyebrow icon={<Icon name="history" size={12} />}>{t("historyTitle")}</Eyebrow>
        <button
          type="button"
          className="history-panel-toggle"
          onClick={() => setPanelOpen((v) => !v)}
          aria-expanded={panelOpen}
        >
          <svg className={`history-panel-chevron${panelOpen ? " open" : ""}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
      <div className={`history-panel-body${panelOpen ? " is-open" : ""}`}>
        <div className="history-list">
        {runs.map((run) => (
          <div key={run.id} className={`history-item-wrap${activeRunId === run.id ? " active" : ""}`}>
            <button
              type="button"
              className="history-item"
              onClick={() => openRun(run.id)}
            >
              <span>{formatDate(run.createdAt, lang)}</span>
              <strong>
                {run.withIssues} {t("issuesLabel")} · {run.total} {t("pagesLabel")}
              </strong>
              <small>{run.sourceUrl}</small>
            </button>
            <div className="history-actions" onClick={(e) => e.stopPropagation()}>
              {confirmId === run.id ? (
                <>
                  <button
                    type="button"
                    className="btn btn-sm btn-danger del-confirm"
                    disabled={deletingId === run.id}
                    onClick={(e) => handleDelete(e, run.id)}
                  >
                    {deletingId === run.id ? "…" : "✓"}
                  </button>
                  <button type="button" className="btn btn-sm btn-neutral del-cancel" onClick={cancelConfirm}>✕</button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn btn-sm btn-ghost del-btn"
                  disabled={deletingId === run.id}
                  title={t("deleteRun") || "Eliminar"}
                  onClick={(e) => handleDelete(e, run.id)}
                >
                  🗑
                </button>
              )}
            </div>
          </div>
        ))}
        {!allRuns.length ? <div className="history-empty">{t("noSavedHistory")}</div> : null}
        </div>
        {hasMore && (
          <button type="button" className="btn btn-sm btn-ghost history-toggle" onClick={() => setShowAll((v) => !v)}>
            {showAll ? t("showLess") || "Ver menos" : `${t("showAll") || "Ver todos"} (${allRuns.length})`}
          </button>
        )}
      </div>
      <style jsx>{`
        :global(.history-panel) {
          display: grid;
          gap: 16px;
          min-width: 0;
        }
        .history-panel-hd {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .history-panel-toggle {
          display: none;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 4px 8px;
          cursor: pointer;
          color: var(--text2);
        }
        .history-panel-toggle:hover {
          border-color: var(--accent);
          color: var(--accent);
        }
        .history-panel-chevron {
          flex-shrink: 0;
          color: var(--accent);
          transition: transform 0.2s;
        }
        .history-panel-chevron.open {
          transform: rotate(180deg);
        }
        .history-panel-body {
          display: contents;
        }
        @media (max-width: 1024px) {
          .history-panel-toggle {
            display: flex;
          }
          .history-panel-body {
            display: none;
          }
          .history-panel-body.is-open {
            display: contents;
          }
        }
        .history-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 12px;
          min-width: 0;
          align-items: start;
        }
        .history-item-wrap {
          position: relative;
          border: 1px solid var(--border);
          border-radius: 16px;
          background: var(--bg);
          transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
          overflow: hidden;
        }
        .history-item-wrap:hover {
          border-color: var(--border2);
        }
        .history-item-wrap.active {
          border-color: rgba(77, 141, 255, 0.62);
          background: rgba(77, 141, 255, 0.15);
          box-shadow: 0 0 0 1px rgba(77, 141, 255, 0.5) inset, 0 12px 24px rgba(32, 92, 179, 0.2);
        }
        .history-item {
          cursor: pointer;
          display: grid;
          gap: 6px;
          font-family: "Manrope", sans-serif;
          width: 100%;
          padding: 16px;
          padding-right: 40px;
          text-align: left;
          color: var(--text);
          background: none;
          border: none;
          min-width: 0;
        }
        .history-item:focus-visible {
          outline: 2px solid rgba(77, 141, 255, 0.8);
          outline-offset: -2px;
          border-radius: 15px;
        }
        .history-item span {
          font-size: 13px;
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
          font-size: 13px;
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: var(--muted);
        }
        .history-actions {
          position: absolute;
          top: 10px;
          right: 10px;
          display: flex;
          gap: 4px;
          align-items: center;
          opacity: 0;
          transition: opacity 0.15s;
        }
        .history-item-wrap:hover .history-actions {
          opacity: 1;
        }
        .del-btn:hover {
          background: rgba(239, 68, 68, 0.12) !important;
          color: var(--error) !important;
          border-color: transparent !important;
        }
        .history-empty {
          border: 1px solid var(--border);
          border-radius: 16px;
          background: var(--bg);
          padding: 16px;
          color: var(--muted);
        }
        .history-toggle {
          color: var(--muted);
          text-align: left;
        }
        .history-toggle:hover {
          color: var(--text2);
        }
      `}</style>
    </Card>
  );
}
