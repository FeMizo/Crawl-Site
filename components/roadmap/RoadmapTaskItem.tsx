"use client";

import Button from "../ui/Button";
import Icon from "../ui/Icon";
import type { RoadmapTaskDto } from "../../types/roadmap";

type Props = {
  task: RoadmapTaskDto;
  canEdit: boolean;
  busy: boolean;
  onToggle: (taskId: string, completed: boolean) => void;
  onDelete: (taskId: string) => void;
};

export default function RoadmapTaskItem({ task, canEdit, busy, onToggle, onDelete }: Props) {
  const statusClass = task.status === "done" ? " done" : task.status === "partial" ? " partial" : "";

  return (
    <div className={`task-item status-${task.status}${statusClass}`}>
      <div className="task-body">
        <label className="task-check">
          <input
            type="checkbox"
            checked={task.status === "done"}
            onChange={(e) => onToggle(task.id, e.target.checked)}
            disabled={!canEdit || busy || task.statusSource === "auto"}
          />
          <span>{task.title}</span>
        </label>
        <div className="task-meta">
          <span className={`task-status ${task.status}`}>
            {task.status === "done" ? "HECHO" : task.status === "partial" ? "PARCIAL" : "PENDIENTE"}
          </span>
          <span className="task-source">{task.statusSource === "auto" ? "AUTO" : "MANUAL"}</span>
        </div>
        {task.note ? <p className="task-note">{task.note}</p> : null}
        {task.evidence.length ? (
          <div className="task-evidence">
            {task.evidence.slice(0, 3).map((item) => (
              <span key={`${task.id}-${item.file}-${item.note || ""}`}>
                {item.file}
                {item.note ? ` | ${item.note}` : ""}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <Button
        type="button"
        variant="outline"
        tone="danger"
        size="sm"
        onClick={() => onDelete(task.id)}
        disabled={!canEdit || busy}
        iconLeft={<Icon name="trash" size={13} />}
      >
        Eliminar
      </Button>

      <style jsx>{`
        .task-item {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: start;
          gap: 10px;
          border: 1px solid var(--border);
          border-radius: 14px;
          background: var(--bg);
          padding: 10px;
        }
        .task-item.done {
          border-color: rgba(63, 140, 255, 0.35);
          background: rgba(63, 140, 255, 0.08);
        }
        .task-item.partial {
          border-color: rgba(255, 193, 92, 0.4);
          background: rgba(255, 193, 92, 0.1);
        }
        .task-body {
          min-width: 0;
          display: grid;
          gap: 6px;
        }
        .task-check {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          cursor: pointer;
        }
        .task-check input {
          width: 16px;
          height: 16px;
          margin: 0;
          accent-color: var(--accent);
        }
        .task-check span {
          color: var(--text);
          font-size: 14px;
          overflow-wrap: anywhere;
        }
        .task-item.done .task-check span {
          text-decoration: line-through;
          color: var(--muted);
        }
        .task-meta {
          display: inline-flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .task-status,
        .task-source {
          display: inline-flex;
          min-height: 20px;
          align-items: center;
          justify-content: center;
          padding: 0 8px;
          border-radius: 999px;
          border: 1px solid var(--border2);
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text2);
          background: var(--bg2);
        }
        .task-status.done {
          color: var(--ok);
          border-color: rgba(66, 211, 146, 0.45);
          background: rgba(66, 211, 146, 0.12);
        }
        .task-status.partial {
          color: var(--warn);
          border-color: rgba(255, 193, 92, 0.45);
          background: rgba(255, 193, 92, 0.12);
        }
        .task-status.pending {
          color: var(--muted);
        }
        .task-note {
          margin: 0;
          color: var(--text2);
          font-size: 12px;
          overflow-wrap: anywhere;
        }
        .task-evidence {
          display: grid;
          gap: 4px;
          min-width: 0;
        }
        .task-evidence span {
          color: var(--muted);
          font-size: 11px;
          overflow-wrap: anywhere;
        }
        @media (max-width: 720px) {
          .task-item {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
