"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Eyebrow from "../ui/Eyebrow";
import Icon from "../ui/Icon";
import StatCard from "../ui/StatCard";
import RoadmapFilters, { type TaskStatusFilter } from "./RoadmapFilters";
import RoadmapPhaseCard from "./RoadmapPhaseCard";
import type { RoadmapDataDto, RoadmapTaskStatus } from "../../types/roadmap";

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
  const [phaseLoadingIds, setPhaseLoadingIds] = useState<Set<string>>(new Set());
  const loadGenRef = useRef(0);
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
    const gen = ++loadGenRef.current;
    const currentFilters = { statusFilter, phaseFilter, query };

    function computeProgress(phases: RoadmapDataDto["phases"]) {
      let completed = 0, partial = 0, total = 0;
      for (const p of phases) {
        completed += p.progress.completed;
        partial += p.progress.partial;
        total += p.progress.total;
      }
      const pending = Math.max(0, total - completed - partial);
      const weighted = completed + partial * 0.5;
      return {
        completed, partial, pending, total,
        percent: total > 0 ? Math.round((weighted / total) * 100) : 0,
      };
    }

    async function loadPhaseData(phaseId: string) {
      setPhaseLoadingIds((prev) => new Set(prev).add(phaseId));
      try {
        const url = buildRoadmapUrl({
          statusFilter: currentFilters.statusFilter,
          phaseFilter: phaseId,
          query: currentFilters.query,
        });
        const payload = await requestRoadmap(url);
        if (gen !== loadGenRef.current) return;
        const loaded = payload.data.phases[0];
        if (!loaded) return;
        setRoadmap((prev) => {
          if (!prev) return prev;
          const phases = prev.phases.map((p) => (p.id === phaseId ? loaded : p));
          return {
            ...prev,
            phases,
            progress: computeProgress(phases),
            source: payload.data.source,
            evaluatedAt: payload.data.evaluatedAt,
          };
        });
      } finally {
        if (gen === loadGenRef.current) {
          setPhaseLoadingIds((prev) => {
            const next = new Set(prev);
            next.delete(phaseId);
            return next;
          });
        }
      }
    }

    // When a specific phase is filtered, load it directly (no need for shells)
    if (currentFilters.phaseFilter !== "all") {
      const payload = await requestRoadmap(buildRoadmapUrl(currentFilters));
      if (gen !== loadGenRef.current) return;
      setRoadmap(payload.data);
      setCanEdit(payload.permissions?.canEdit ?? true);
      return;
    }

    // Step 1: load phase shells (fast — no tasks, no analysis)
    const shellPayload = await requestRoadmap("/api/roadmap?phasesOnly=true");
    if (gen !== loadGenRef.current) return;
    setRoadmap(shellPayload.data);
    setCanEdit(shellPayload.permissions?.canEdit ?? true);

    // Step 2: load each phase's tasks in parallel
    await Promise.all(shellPayload.data.phases.map((p) => loadPhaseData(p.id)));
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

    // Optimistic update: flip checkbox immediately
    setRoadmap((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        phases: prev.phases.map((phase) => ({
          ...phase,
          tasks: phase.tasks.map((task) =>
            task.id === taskId
              ? { ...task, completed, status: (completed ? "done" : "pending") as RoadmapTaskStatus }
              : task,
          ),
        })),
      };
    });

    try {
      await requestRoadmap(`/api/roadmap/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ completed }),
      });
      await loadRoadmap(); // Recalculate progress from server
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo actualizar la tarea",
      );
      await loadRoadmap(); // Revert optimistic update on error
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

      <RoadmapFilters
        statusFilter={statusFilter}
        phaseFilter={phaseFilter}
        queryInput={queryInput}
        phaseOptions={phaseOptions}
        hasActiveFilters={hasActiveFilters}
        onStatusChange={setStatusFilter}
        onPhaseChange={setPhaseFilter}
        onQueryChange={setQueryInput}
        onClear={clearFilters}
      />

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
          <RoadmapPhaseCard
            key={phase.id}
            phase={phase}
            canEdit={canEdit}
            busyTaskId={busyTaskId}
            hasActiveFilters={hasActiveFilters}
            loadingTasks={phaseLoadingIds.has(phase.id)}
            onCreateTask={handleCreateTask}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
          />
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
        .phase-form-card {
          border-style: dashed;
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
        .phase-card.empty p {
          margin: 0;
          color: var(--text2);
        }
        .read-only {
          margin: 0;
          color: var(--warn);
          font-size: 12px;
        }
      `}</style>
    </div>
  );
}
