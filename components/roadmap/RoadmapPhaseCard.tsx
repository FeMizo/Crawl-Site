"use client";

import AddTaskForm from "./AddTaskForm";
import Card from "../ui/Card";
import RoadmapTaskItem from "./RoadmapTaskItem";
import type { RoadmapPhaseDto } from "../../types/roadmap";

type Props = {
  phase: RoadmapPhaseDto;
  canEdit: boolean;
  busyTaskId: string;
  hasActiveFilters: boolean;
  onCreateTask: (phaseId: string, title: string) => Promise<void>;
  onToggleTask: (taskId: string, completed: boolean) => void;
  onDeleteTask: (taskId: string) => Promise<void>;
};

export default function RoadmapPhaseCard({
  phase,
  canEdit,
  busyTaskId,
  hasActiveFilters,
  onCreateTask,
  onToggleTask,
  onDeleteTask,
}: Props) {
  return (
    <Card className="phase-card">
      <div className="phase-head">
        <div className="phase-meta">
          <span className="phase-pill">Fase {phase.position + 1}</span>
          <h3>{phase.title}</h3>
          {phase.description ? <p>{phase.description}</p> : null}
        </div>
        <div className="phase-counter">{phase.progress.percent}%</div>
      </div>

      <div className="progress-track">
        <span className="progress-fill" style={{ width: `${phase.progress.percent}%` }} />
      </div>

      <div className="phase-tally">
        {phase.progress.completed} done | {phase.progress.partial} partial
        {" | "}
        {phase.progress.pending} pending
      </div>

      <AddTaskForm phaseId={phase.id} canEdit={canEdit} onSubmit={onCreateTask} />

      <div className="task-list">
        {phase.tasks.map((task) => (
          <RoadmapTaskItem
            key={task.id}
            task={task}
            canEdit={canEdit}
            busy={busyTaskId === task.id}
            onToggle={onToggleTask}
            onDelete={onDeleteTask}
          />
        ))}
        {!phase.tasks.length ? (
          <p className="task-empty">
            {hasActiveFilters
              ? "Ninguna tarea coincide con los filtros."
              : "Sin tareas en esta fase."}
          </p>
        ) : null}
      </div>

      <style jsx>{`
        .phase-card {
          display: grid;
          gap: 12px;
          min-width: 0;
        }
        .phase-head {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: flex-start;
        }
        .phase-meta {
          min-width: 0;
          display: grid;
          gap: 6px;
        }
        .phase-pill {
          display: inline-flex;
          width: fit-content;
          min-height: 22px;
          align-items: center;
          justify-content: center;
          padding: 0 10px;
          border-radius: 999px;
          background: var(--adim);
          border: 1px solid rgba(77, 141, 255, 0.35);
          color: #77abff;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .phase-meta h3 {
          margin: 0;
          font-family: "Syne", "Manrope", sans-serif;
          font-size: 1.25rem;
          overflow-wrap: anywhere;
        }
        .phase-meta p {
          margin: 0;
          color: var(--text2);
          font-size: 14px;
          overflow-wrap: anywhere;
        }
        .phase-counter {
          min-width: 60px;
          text-align: right;
          color: #77abff;
          font-family: "Syne", "Manrope", sans-serif;
          font-weight: 700;
          font-size: 1.15rem;
        }
        .phase-tally {
          font-size: 13px;
          color: var(--text2);
        }
        .task-list {
          display: grid;
          gap: 8px;
        }
        .task-empty {
          margin: 0;
          color: var(--muted);
          font-size: 14px;
        }
        .progress-track {
          position: relative;
          height: 10px;
          border-radius: 999px;
          background: var(--bg3);
          overflow: hidden;
          border: 1px solid var(--border2);
        }
        .progress-fill {
          display: block;
          height: 100%;
          max-width: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #3f8cff, #6bb5ff);
        }
      `}</style>
    </Card>
  );
}
