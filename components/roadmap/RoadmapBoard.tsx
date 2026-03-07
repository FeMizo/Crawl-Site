"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import AddTaskForm from "./AddTaskForm";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Icon from "../ui/Icon";
import StatCard from "../ui/StatCard";
import type { RoadmapDataDto } from "../../types/roadmap";

type RoadmapApiResponse = {
  data: RoadmapDataDto;
  permissions?: {
    canEdit?: boolean;
  };
  error?: string;
};

async function requestRoadmap(
  input: string,
  init?: RequestInit,
): Promise<RoadmapApiResponse> {
  const response = await fetch(input, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const body = (await response.json().catch(() => ({}))) as RoadmapApiResponse;
  if (!response.ok) {
    throw new Error(body.error || "No se pudo completar la solicitud");
  }
  return body;
}

export default function RoadmapBoard() {
  const [roadmap, setRoadmap] = useState<RoadmapDataDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [phaseTitle, setPhaseTitle] = useState("");
  const [phaseDescription, setPhaseDescription] = useState("");
  const [creatingPhase, setCreatingPhase] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState("");
  const [canEdit, setCanEdit] = useState(true);

  const loadRoadmap = useCallback(async () => {
    const payload = await requestRoadmap("/api/roadmap");
    setRoadmap(payload.data);
    setCanEdit(payload.permissions?.canEdit ?? true);
  }, []);

  useEffect(() => {
    let active = true;

    loadRoadmap()
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "No se pudo cargar el roadmap");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loadRoadmap]);

  const globalPercent = roadmap?.progress.percent ?? 0;
  const globalCompleted = roadmap?.progress.completed ?? 0;
  const globalTotal = roadmap?.progress.total ?? 0;
  const phases = roadmap?.phases ?? [];

  const completedPhases = useMemo(
    () => phases.filter((phase) => phase.progress.total > 0 && phase.progress.completed === phase.progress.total).length,
    [phases],
  );

  const handleCreatePhase = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canEdit || creatingPhase) return;

    const title = phaseTitle.trim();
    const description = phaseDescription.trim();
    if (!title) return;

    setCreatingPhase(true);
    setError("");

    try {
      const payload = await requestRoadmap("/api/roadmap/phases", {
        method: "POST",
        body: JSON.stringify({ title, description }),
      });
      setRoadmap(payload.data);
      setPhaseTitle("");
      setPhaseDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la fase");
    } finally {
      setCreatingPhase(false);
    }
  };

  const handleCreateTask = async (phaseId: string, title: string) => {
    const payload = await requestRoadmap("/api/roadmap/tasks", {
      method: "POST",
      body: JSON.stringify({ phaseId, title }),
    });
    setRoadmap(payload.data);
  };

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    if (!canEdit) return;
    setBusyTaskId(taskId);
    setError("");

    try {
      const payload = await requestRoadmap(`/api/roadmap/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ completed }),
      });
      setRoadmap(payload.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar la tarea");
    } finally {
      setBusyTaskId("");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!canEdit) return;

    const confirmed = window.confirm("Esta tarea se eliminara permanentemente. Continuar?");
    if (!confirmed) return;

    setBusyTaskId(taskId);
    setError("");

    try {
      const payload = await requestRoadmap(`/api/roadmap/tasks/${taskId}`, {
        method: "DELETE",
      });
      setRoadmap(payload.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar la tarea");
    } finally {
      setBusyTaskId("");
    }
  };

  if (loading) {
    return <Card><p className="feedback">Cargando roadmap...</p></Card>;
  }

  return (
    <div className="roadmap-root">
      {error ? <p className="feedback error">{error}</p> : null}

      <div className="roadmap-overview">
        <StatCard
          label="Progreso global"
          value={`${globalPercent}%`}
          hint={`${globalCompleted}/${globalTotal} tareas completadas`}
          tone="primary"
          icon={<Icon name="roadmap" size={14} />}
        />
        <StatCard
          label="Fases"
          value={phases.length}
          hint={`${completedPhases} completadas`}
          tone="secondary"
          icon={<Icon name="projects" size={14} />}
        />
      </div>

      <Card className="roadmap-progress-card" padding="sm">
        <div className="progress-label-row">
          <span>Avance total</span>
          <strong>{globalPercent}%</strong>
        </div>
        <div className="progress-track">
          <span className="progress-fill" style={{ width: `${globalPercent}%` }} />
        </div>
      </Card>

      <Card className="phase-form-card">
        <form className="phase-form" onSubmit={handleCreatePhase}>
          <div className="eyebrow">
            <Icon name="plus" size={12} />
            Nueva fase
          </div>
          <input
            className="ui-input"
            type="text"
            placeholder={canEdit ? "Titulo de la fase" : "Solo lectura"}
            value={phaseTitle}
            onChange={(event) => setPhaseTitle(event.target.value)}
            disabled={!canEdit || creatingPhase}
          />
          <input
            className="ui-input"
            type="text"
            placeholder="Descripcion opcional"
            value={phaseDescription}
            onChange={(event) => setPhaseDescription(event.target.value)}
            disabled={!canEdit || creatingPhase}
          />
          <Button
            type="submit"
            variant="solid"
            tone="primary"
            iconLeft={<Icon name="plus" size={15} />}
            loading={creatingPhase}
            disabled={!canEdit}
          >
            Crear fase
          </Button>
        </form>
      </Card>

      <div className="phase-grid">
        {phases.map((phase) => (
          <Card key={phase.id} className="phase-card">
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
              {phase.progress.completed}/{phase.progress.total} completadas
            </div>

            <AddTaskForm phaseId={phase.id} canEdit={canEdit} onSubmit={handleCreateTask} />

            <div className="task-list">
              {phase.tasks.map((task) => (
                <div key={task.id} className={`task-item${task.completed ? " done" : ""}`}>
                  <label className="task-check">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={(event) => handleToggleTask(task.id, event.target.checked)}
                      disabled={!canEdit || busyTaskId === task.id}
                    />
                    <span>{task.title}</span>
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    tone="danger"
                    size="sm"
                    onClick={() => handleDeleteTask(task.id)}
                    disabled={!canEdit || busyTaskId === task.id}
                    iconLeft={<Icon name="trash" size={13} />}
                  >
                    Eliminar
                  </Button>
                </div>
              ))}
              {!phase.tasks.length ? <p className="task-empty">Sin tareas en esta fase.</p> : null}
            </div>
          </Card>
        ))}

        {!phases.length ? (
          <Card className="phase-card empty">
            <div className="eyebrow">Roadmap vacio</div>
            <h3>Comienza creando tu primera fase</h3>
            <p>Define hitos y tareas para seguir el avance interno del proyecto.</p>
          </Card>
        ) : null}
      </div>

      {!canEdit ? (
        <p className="read-only">
          Tu sesion tiene acceso de lectura. Para editar configura `ROADMAP_ADMIN_EMAILS`.
        </p>
      ) : null}

      <style jsx>{`
        .roadmap-root {
          display: grid;
          gap: 16px;
          min-width: 0;
        }
        .feedback {
          margin: 0;
          color: var(--text2);
        }
        .feedback.error {
          color: var(--error);
        }
        .roadmap-overview {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
        }
        .roadmap-progress-card {
          display: grid;
          gap: 10px;
        }
        .progress-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          color: var(--text2);
          font-size: 13px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .progress-label-row strong {
          color: var(--text);
          letter-spacing: normal;
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
        .phase-form-card {
          border-style: dashed;
        }
        .phase-form {
          display: grid;
          gap: 10px;
          min-width: 0;
        }
        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--muted);
          font-size: 11px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }
        .phase-grid {
          display: grid;
          gap: 14px;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          min-width: 0;
        }
        .phase-card {
          display: grid;
          gap: 12px;
          min-width: 0;
        }
        .phase-card.empty p {
          margin: 0;
          color: var(--text2);
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
        .task-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
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
        .task-empty {
          margin: 0;
          color: var(--muted);
          font-size: 14px;
        }
        .read-only {
          margin: 0;
          color: var(--warn);
          font-size: 12px;
        }
        @media (max-width: 720px) {
          .task-item {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
