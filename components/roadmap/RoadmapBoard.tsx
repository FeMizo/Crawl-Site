"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import AddTaskForm from "./AddTaskForm";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Eyebrow from "../ui/Eyebrow";
import Icon from "../ui/Icon";
import StatCard from "../ui/StatCard";
import type { RoadmapDataDto, RoadmapTaskStatus } from "../../types/roadmap";

type RoadmapApiResponse = {
  data: RoadmapDataDto;
  permissions?: {
    canEdit?: boolean;
  };
  error?: string;
};

type TaskStatusFilter = RoadmapTaskStatus | "all";

const STATUS_FILTERS: Array<{ value: TaskStatusFilter; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "done", label: "Done" },
  { value: "partial", label: "Partial" },
  { value: "pending", label: "Pending" },
];

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

function buildRoadmapUrl(filters: {
  statusFilter: TaskStatusFilter;
  phaseFilter: string;
  query: string;
}): string {
  const params = new URLSearchParams();
  if (filters.statusFilter !== "all") {
    params.set("status", filters.statusFilter);
  }
  if (filters.phaseFilter !== "all") {
    params.set("phaseId", filters.phaseFilter);
  }
  if (filters.query) {
    params.set("q", filters.query);
  }
  const query = params.toString();
  return query ? `/api/roadmap?${query}` : "/api/roadmap";
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
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>("all");
  const [phaseFilter, setPhaseFilter] = useState("all");
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const normalized = queryInput.trim().slice(0, 120);
      setQuery(normalized);
    }, 200);

    return () => window.clearTimeout(handle);
  }, [queryInput]);

  const loadRoadmap = useCallback(async () => {
    const payload = await requestRoadmap(
      buildRoadmapUrl({ statusFilter, phaseFilter, query }),
    );
    setRoadmap(payload.data);
    setCanEdit(payload.permissions?.canEdit ?? true);
  }, [phaseFilter, query, statusFilter]);

  useEffect(() => {
    let active = true;

    loadRoadmap()
      .catch((err) => {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "No se pudo cargar el roadmap",
        );
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
  const globalPartial = roadmap?.progress.partial ?? 0;
  const globalPending = roadmap?.progress.pending ?? 0;
  const phases = roadmap?.phases ?? [];
  const source = roadmap?.source;
  const evaluatedAt = roadmap?.evaluatedAt;
  const totalVisibleTasks = useMemo(
    () => phases.reduce((acc, phase) => acc + phase.tasks.length, 0),
    [phases],
  );

  const completedPhases = useMemo(
    () =>
      phases.filter(
        (phase) =>
          phase.progress.total > 0 &&
          phase.progress.completed === phase.progress.total &&
          phase.progress.partial === 0,
      ).length,
    [phases],
  );

  const phaseOptions = useMemo(() => {
    const fromRoadmap = roadmap?.phases ?? [];
    return [
      { value: "all", label: "Todas las fases" },
      ...fromRoadmap.map((phase) => ({
        value: phase.id,
        label: `Fase ${phase.position + 1}: ${phase.title}`,
      })),
    ];
  }, [roadmap?.phases]);

  const hasActiveFilters =
    statusFilter !== "all" || phaseFilter !== "all" || Boolean(query);

  const evaluatedLabel = useMemo(() => {
    if (!evaluatedAt) return "";
    const value = new Date(evaluatedAt);
    if (Number.isNaN(value.getTime())) return "";
    return value.toLocaleString("es-MX");
  }, [evaluatedAt]);

  const clearFilters = () => {
    setStatusFilter("all");
    setPhaseFilter("all");
    setQueryInput("");
    setQuery("");
  };

  const handleCreatePhase = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canEdit || creatingPhase) return;

    const title = phaseTitle.trim();
    const description = phaseDescription.trim();
    if (!title) return;

    setCreatingPhase(true);
    setError("");

    try {
      await requestRoadmap("/api/roadmap/phases", {
        method: "POST",
        body: JSON.stringify({ title, description }),
      });
      setPhaseTitle("");
      setPhaseDescription("");
      await loadRoadmap();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la fase");
    } finally {
      setCreatingPhase(false);
    }
  };

  const handleCreateTask = async (phaseId: string, title: string) => {
    await requestRoadmap("/api/roadmap/tasks", {
      method: "POST",
      body: JSON.stringify({ phaseId, title }),
    });
    await loadRoadmap();
  };

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    if (!canEdit) return;
    setBusyTaskId(taskId);
    setError("");

    try {
      await requestRoadmap(`/api/roadmap/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ completed }),
      });
      await loadRoadmap();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar la tarea",
      );
    } finally {
      setBusyTaskId("");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!canEdit) return;

    const confirmed = window.confirm(
      "Esta tarea se eliminara permanentemente. Continuar?",
    );
    if (!confirmed) return;

    setBusyTaskId(taskId);
    setError("");

    try {
      await requestRoadmap(`/api/roadmap/tasks/${taskId}`, {
        method: "DELETE",
      });
      await loadRoadmap();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo eliminar la tarea",
      );
    } finally {
      setBusyTaskId("");
    }
  };

  if (loading) {
    return (
      <Card>
        <p className="feedback">Cargando roadmap...</p>
      </Card>
    );
  }

  return (
    <div className="roadmap-root">
      {error ? <p className="feedback error">{error}</p> : null}

      <div className="roadmap-overview">
        <StatCard
          label="Progreso global"
          value={`${globalPercent}%`}
          hint={`${globalCompleted} done | ${globalPartial} partial | ${globalPending} pending`}
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
        <StatCard
          label="Tareas visibles"
          value={totalVisibleTasks}
          hint={hasActiveFilters ? "Vista filtrada" : "Vista completa"}
          tone="secondary"
          icon={<Icon name="tasks" size={14} />}
        />
      </div>
      {source ? (
        <p className="analysis-meta">
          Fuente activa: <strong>{source.type}</strong> ({source.location})
          {evaluatedLabel ? ` | Analizado: ${evaluatedLabel}` : ""}
        </p>
      ) : null}

      <Card className="roadmap-progress-card" padding="sm">
        <div className="progress-label-row">
          <span>Avance total</span>
          <strong>{globalPercent}%</strong>
        </div>
        <div className="progress-track">
          <span className="progress-fill" style={{ width: `${globalPercent}%` }} />
        </div>
      </Card>

      <Card className="filters-card" padding="sm">
        <div className="filters-head">
          <Eyebrow icon={<Icon name="filter" size={12} />}>Filtros</Eyebrow>
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="outline"
              tone="secondary"
              size="sm"
              onClick={clearFilters}
            >
              Limpiar
            </Button>
          ) : null}
        </div>
        <div className="filters-grid">
          <label className="ui-field">
            <span className="ui-field-label">Busqueda</span>
            <input
              className="ui-input"
              type="search"
              value={queryInput}
              onChange={(event) => setQueryInput(event.target.value)}
              placeholder="Buscar por tarea, nota o archivo..."
            />
          </label>
          <label className="ui-field">
            <span className="ui-field-label">Estado</span>
            <select
              className="ui-select"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as TaskStatusFilter)
              }
            >
              {STATUS_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="ui-field">
            <span className="ui-field-label">Fase</span>
            <select
              className="ui-select"
              value={phaseFilter}
              onChange={(event) => setPhaseFilter(event.target.value)}
            >
              {phaseOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      <Card className="phase-form-card">
        <form className="phase-form" onSubmit={handleCreatePhase}>
          <Eyebrow icon={<Icon name="plus" size={12} />}>Nueva fase</Eyebrow>
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
              <span
                className="progress-fill"
                style={{ width: `${phase.progress.percent}%` }}
              />
            </div>

            <div className="phase-tally">
              {phase.progress.completed} done | {phase.progress.partial} partial
              {" | "}
              {phase.progress.pending} pending
            </div>

            <AddTaskForm
              phaseId={phase.id}
              canEdit={canEdit}
              onSubmit={handleCreateTask}
            />

            <div className="task-list">
              {phase.tasks.map((task) => (
                <div
                  key={task.id}
                  className={`task-item status-${task.status}${
                    task.status === "done"
                      ? " done"
                      : task.status === "partial"
                        ? " partial"
                        : ""
                  }`}
                >
                  <div className="task-body">
                    <label className="task-check">
                      <input
                        type="checkbox"
                        checked={task.status === "done"}
                        onChange={(event) =>
                          handleToggleTask(task.id, event.target.checked)
                        }
                        disabled={
                          !canEdit ||
                          busyTaskId === task.id ||
                          task.statusSource === "auto"
                        }
                      />
                      <span>{task.title}</span>
                    </label>
                    <div className="task-meta">
                      <span className={`task-status ${task.status}`}>
                        {task.status.toUpperCase()}
                      </span>
                      <span className="task-source">
                        {task.statusSource === "auto" ? "AUTO" : "MANUAL"}
                      </span>
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
                    onClick={() => handleDeleteTask(task.id)}
                    disabled={!canEdit || busyTaskId === task.id}
                    iconLeft={<Icon name="trash" size={13} />}
                  >
                    Eliminar
                  </Button>
                </div>
              ))}
              {!phase.tasks.length ? (
                <p className="task-empty">
                  {hasActiveFilters
                    ? "Ninguna tarea coincide con los filtros."
                    : "Sin tareas en esta fase."}
                </p>
              ) : null}
            </div>
          </Card>
        ))}

        {!phases.length ? (
          <Card className="phase-card empty">
            <Eyebrow>Roadmap vacio</Eyebrow>
            <h3>
              {hasActiveFilters
                ? "Sin resultados para los filtros actuales"
                : "Comienza creando tu primera fase"}
            </h3>
            <p>
              {hasActiveFilters
                ? "Ajusta la busqueda, estado o fase para ver mas tareas."
                : "Define hitos y tareas para seguir el avance interno del proyecto."}
            </p>
          </Card>
        ) : null}
      </div>

      {!canEdit ? (
        <p className="read-only">
          Tu sesion tiene acceso de lectura. Para editar necesitas un rol con
          permisos (<code>owner</code>, <code>super_admin</code>,{" "}
          <code>admin</code> o <code>editor</code>) o una lista permitida valida en{" "}
          <code>ROADMAP_ADMIN_EMAILS</code>.
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
        .analysis-meta {
          margin: 0;
          color: var(--muted);
          font-size: 12px;
          overflow-wrap: anywhere;
        }
        .analysis-meta strong {
          color: var(--text2);
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
        .filters-card,
        .phase-form-card {
          border-style: dashed;
        }
        .filters-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 10px;
        }
        .filters-grid {
          display: grid;
          gap: 10px;
          grid-template-columns: minmax(0, 1fr) repeat(2, minmax(180px, 220px));
        }
        .phase-form {
          display: grid;
          gap: 10px;
          min-width: 0;
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
        @media (max-width: 840px) {
          .filters-grid {
            grid-template-columns: 1fr;
          }
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
