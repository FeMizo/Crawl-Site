import { prisma } from "./prisma";
import type {
  RoadmapDataDto,
  RoadmapPhaseDto,
  RoadmapTaskDto,
  RoadmapTaskStatus,
} from "../types/roadmap";
import { analyzeRoadmapPhases } from "./roadmap-analysis";

const MAX_PHASE_TITLE_LENGTH = 120;
const MAX_PHASE_DESCRIPTION_LENGTH = 240;
const MAX_TASK_TITLE_LENGTH = 160;

function clampPercent(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function normalizeTitle(value: unknown, maxLength: number): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

export function normalizePhaseTitle(value: unknown): string {
  return normalizeTitle(value, MAX_PHASE_TITLE_LENGTH);
}

export function normalizePhaseDescription(value: unknown): string | null {
  const normalized = normalizeTitle(value, MAX_PHASE_DESCRIPTION_LENGTH);
  return normalized || null;
}

export function normalizeTaskTitle(value: unknown): string {
  return normalizeTitle(value, MAX_TASK_TITLE_LENGTH);
}

const ROADMAP_STATUS_OPTIONS = new Set<RoadmapTaskStatus | "all">([
  "all",
  "done",
  "partial",
  "pending",
]);

export type RoadmapTaskFilterInput = {
  status?: RoadmapTaskStatus | "all";
  query?: string;
  phaseId?: string;
  phasesOnly?: boolean;
};

function normalizeRoadmapStatus(value: unknown): RoadmapTaskStatus | "all" {
  const normalized = String(value || "")
    .trim()
    .toLowerCase() as RoadmapTaskStatus | "all";
  if (ROADMAP_STATUS_OPTIONS.has(normalized)) {
    return normalized;
  }
  return "all";
}

function normalizeRoadmapQuery(value: unknown): string {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .slice(0, 120);
}

function normalizeRoadmapPhaseId(value: unknown): string {
  return String(value || "").trim().slice(0, 80);
}

function mapTaskSearchText(task: RoadmapTaskDto): string {
  const evidenceText = task.evidence
    .map((item) => `${item.file} ${item.note || ""}`)
    .join(" ");
  return `${task.title} ${task.note || ""} ${evidenceText}`.toLowerCase();
}

function computeTaskProgress(tasks: RoadmapTaskDto[]) {
  const completed = tasks.filter((task) => task.status === "done").length;
  const partial = tasks.filter((task) => task.status === "partial").length;
  const total = tasks.length;
  const pending = Math.max(0, total - completed - partial);
  const weighted = completed + partial * 0.5;
  return {
    completed,
    partial,
    pending,
    total,
    percent: clampPercent(weighted, total),
  };
}

function computeGlobalProgress(phases: RoadmapPhaseDto[]) {
  let completed = 0;
  let partial = 0;
  let total = 0;

  for (const phase of phases) {
    completed += phase.progress.completed;
    partial += phase.progress.partial;
    total += phase.progress.total;
  }

  const pending = Math.max(0, total - completed - partial);
  const weighted = completed + partial * 0.5;

  return {
    completed,
    partial,
    pending,
    total,
    percent: clampPercent(weighted, total),
  };
}

function applyRoadmapTaskFilters(
  roadmap: RoadmapDataDto,
  filters?: RoadmapTaskFilterInput,
): RoadmapDataDto {
  const status = normalizeRoadmapStatus(filters?.status);
  const query = normalizeRoadmapQuery(filters?.query);
  const phaseId = normalizeRoadmapPhaseId(filters?.phaseId);
  const hasTaskFilters = status !== "all" || Boolean(query);

  const phaseScoped = phaseId
    ? roadmap.phases.filter((phase) => phase.id === phaseId)
    : roadmap.phases;

  const phases = phaseScoped
    .map((phase) => {
      const filteredTasks = phase.tasks.filter((task) => {
        if (status !== "all" && task.status !== status) return false;
        if (query && !mapTaskSearchText(task).includes(query)) return false;
        return true;
      });

      return {
        ...phase,
        tasks: filteredTasks,
        progress: computeTaskProgress(filteredTasks),
      };
    })
    .filter((phase) => {
      if (!hasTaskFilters) return true;
      if (phaseId) return true;
      return phase.tasks.length > 0;
    });

  return {
    ...roadmap,
    phases,
    progress: computeGlobalProgress(phases),
  };
}

function mapTask(task: {
  id: string;
  phaseId: string;
  title: string;
  completed: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}): RoadmapTaskDto {
  return {
    id: task.id,
    phaseId: task.phaseId,
    title: task.title,
    completed: task.completed,
    status: task.completed ? "done" : "pending",
    statusSource: "manual",
    evidence: [],
    note: null,
    position: task.position,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

function mapPhase(phase: {
  id: string;
  title: string;
  description: string | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  tasks: Array<{
    id: string;
    phaseId: string;
    title: string;
    completed: boolean;
    position: number;
    createdAt: Date;
    updatedAt: Date;
  }>;
}): RoadmapPhaseDto {
  const tasks = phase.tasks.map(mapTask);
  const completed = tasks.filter((task) => task.completed).length;
  const partial = 0;
  const total = tasks.length;

  return {
    id: phase.id,
    title: phase.title,
    description: phase.description,
    position: phase.position,
    createdAt: phase.createdAt.toISOString(),
    updatedAt: phase.updatedAt.toISOString(),
    progress: {
      completed,
      partial,
      pending: total - completed - partial,
      total,
      percent: clampPercent(completed, total),
    },
    tasks,
  };
}

export async function getRoadmapData(filters?: RoadmapTaskFilterInput): Promise<RoadmapDataDto> {
  const phaseId = normalizeRoadmapPhaseId(filters?.phaseId);
  const phasesOnly = filters?.phasesOnly === true;

  if (phasesOnly) {
    const phases = await prisma.roadmapPhase.findMany({
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        title: true,
        description: true,
        position: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const mappedPhases = phases.map((phase) =>
      mapPhase({ ...phase, tasks: [] }),
    );

    return {
      phases: mappedPhases,
      progress: { completed: 0, partial: 0, pending: 0, total: 0, percent: 0 },
      source: { type: "database", location: "prisma" },
      evaluatedAt: new Date().toISOString(),
    };
  }

  const phases = await prisma.roadmapPhase.findMany({
    where: phaseId ? { id: phaseId } : undefined,
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      title: true,
      description: true,
      position: true,
      createdAt: true,
      updatedAt: true,
      tasks: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          phaseId: true,
          title: true,
          completed: true,
          position: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  const mappedPhases = phases.map(mapPhase);
  const analyzed = await analyzeRoadmapPhases(mappedPhases);
  return applyRoadmapTaskFilters(analyzed, filters);
}

export async function createRoadmapPhase(input: { title: string; description?: string | null }) {
  const currentMax = await prisma.roadmapPhase.aggregate({
    _max: { position: true },
  });

  const phase = await prisma.roadmapPhase.create({
    data: {
      title: input.title,
      description: input.description ?? null,
      position: (currentMax._max.position ?? -1) + 1,
    },
  });

  return phase;
}

export async function createRoadmapTask(input: { phaseId: string; title: string }) {
  const phase = await prisma.roadmapPhase.findUnique({
    where: { id: input.phaseId },
    select: { id: true },
  });

  if (!phase) {
    return { notFound: true as const };
  }

  const currentMax = await prisma.roadmapTask.aggregate({
    where: { phaseId: input.phaseId },
    _max: { position: true },
  });

  const task = await prisma.roadmapTask.create({
    data: {
      phaseId: input.phaseId,
      title: input.title,
      position: (currentMax._max.position ?? -1) + 1,
    },
  });

  return { task, notFound: false as const };
}

export async function updateRoadmapTaskCompletion(taskId: string, completed: boolean) {
  try {
    const task = await prisma.roadmapTask.update({
      where: { id: taskId },
      data: { completed },
    });
    return { task, notFound: false as const };
  } catch {
    return { task: null, notFound: true as const };
  }
}

export async function deleteRoadmapTask(taskId: string) {
  try {
    await prisma.roadmapTask.delete({
      where: { id: taskId },
    });
    return { notFound: false as const };
  } catch {
    return { notFound: true as const };
  }
}
