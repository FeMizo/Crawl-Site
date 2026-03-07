import { prisma } from "./prisma";
import type { RoadmapDataDto, RoadmapPhaseDto, RoadmapTaskDto } from "../types/roadmap";

const MAX_PHASE_TITLE_LENGTH = 120;
const MAX_PHASE_DESCRIPTION_LENGTH = 240;
const MAX_TASK_TITLE_LENGTH = 160;

function clampPercent(completed: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((completed / total) * 100);
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
      total,
      percent: clampPercent(completed, total),
    },
    tasks,
  };
}

export async function getRoadmapData(): Promise<RoadmapDataDto> {
  const phases = await prisma.roadmapPhase.findMany({
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    include: {
      tasks: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  const mappedPhases = phases.map(mapPhase);
  const total = mappedPhases.reduce((acc, phase) => acc + phase.progress.total, 0);
  const completed = mappedPhases.reduce((acc, phase) => acc + phase.progress.completed, 0);

  return {
    phases: mappedPhases,
    progress: {
      completed,
      total,
      percent: clampPercent(completed, total),
    },
  };
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
