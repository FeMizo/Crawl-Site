import { promises as fs } from "fs";
import path from "path";
import type {
  RoadmapGlobalProgressDto,
  RoadmapPhaseDto,
  RoadmapPhaseProgressDto,
  RoadmapSourceDto,
  RoadmapTaskDto,
  RoadmapTaskEvidenceDto,
  RoadmapTaskStatus,
} from "../types/roadmap";

type RepoSnapshot = {
  files: Map<string, string>;
};

type TaskAssessment = {
  status: RoadmapTaskStatus;
  statusSource: "auto" | "manual";
  evidence: RoadmapTaskEvidenceDto[];
  note: string | null;
};

type SnapshotCache = {
  at: number;
  snapshot: RepoSnapshot | null;
};

const SOURCE_DIRECTORIES = [
  "app",
  "components",
  "docs",
  "lib",
  "pages",
  "prisma",
  "public",
  "src",
  "templates",
  "types",
];

const ALLOWED_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".md",
  ".json",
  ".css",
  ".html",
  ".prisma",
]);

const SNAPSHOT_TTL_MS = 30_000;
const MAX_FILE_SIZE_BYTES = 1_000_000;

const cache: SnapshotCache = {
  at: 0,
  snapshot: null,
};

function normalizePath(value: string): string {
  return value.replace(/\\/g, "/");
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function fileEvidence(file: string, note?: string): RoadmapTaskEvidenceDto {
  return note ? { file, note } : { file };
}

async function walkDirectory(rootPath: string, baseDir: string, result: string[]) {
  const currentPath = path.join(rootPath, baseDir);
  let entries;

  try {
    entries = await fs.readdir(currentPath, {
      withFileTypes: true,
      encoding: "utf8",
    });
  } catch {
    return;
  }

  for (const entry of entries) {
    const entryName = String(entry.name);
    if (entryName.startsWith(".")) continue;
    if (entryName === "node_modules" || entryName === ".next") continue;

    const relative = normalizePath(path.join(baseDir, entryName));
    if (entry.isDirectory()) {
      await walkDirectory(rootPath, relative, result);
      continue;
    }

    if (!entry.isFile()) continue;
    if (!ALLOWED_EXTENSIONS.has(path.extname(entryName).toLowerCase())) continue;

    result.push(relative);
  }
}

async function buildRepoSnapshot(): Promise<RepoSnapshot> {
  const root = process.cwd();
  const filePaths: string[] = [];

  for (const sourceDir of SOURCE_DIRECTORIES) {
    await walkDirectory(root, sourceDir, filePaths);
  }

  const files = new Map<string, string>();
  await Promise.all(
    filePaths.map(async (relativePath) => {
      try {
        const absolutePath = path.join(root, relativePath);
        const stat = await fs.stat(absolutePath);
        if (stat.size > MAX_FILE_SIZE_BYTES) return;
        const content = await fs.readFile(absolutePath, "utf8");
        files.set(relativePath, normalizeText(content));
      } catch {
        // Ignore unreadable files.
      }
    }),
  );

  return { files };
}

async function getRepoSnapshot(): Promise<RepoSnapshot> {
  const now = Date.now();
  if (cache.snapshot && now - cache.at < SNAPSHOT_TTL_MS) {
    return cache.snapshot;
  }

  const snapshot = await buildRepoSnapshot();
  cache.snapshot = snapshot;
  cache.at = now;
  return snapshot;
}

function hasFile(snapshot: RepoSnapshot, relativePath: string): boolean {
  return snapshot.files.has(normalizePath(relativePath));
}

function fileHas(
  snapshot: RepoSnapshot,
  relativePath: string,
  pattern: string | RegExp,
): boolean {
  const content = snapshot.files.get(normalizePath(relativePath));
  if (!content) return false;
  if (typeof pattern === "string") {
    return content.includes(normalizeText(pattern));
  }
  return pattern.test(content);
}

function countFilesWith(snapshot: RepoSnapshot, pattern: string | RegExp): number {
  let count = 0;
  for (const content of snapshot.files.values()) {
    if (typeof pattern === "string") {
      if (content.includes(normalizeText(pattern))) count += 1;
    } else if (pattern.test(content)) {
      count += 1;
    }
  }
  return count;
}

function matchesTask(title: string, includesAll: string[]): boolean {
  const normalized = normalizeText(title);
  return includesAll.every((part) => normalized.includes(normalizeText(part)));
}

function assessKnownTask(task: RoadmapTaskDto, snapshot: RepoSnapshot): TaskAssessment | null {
  const title = normalizeText(task.title);

  if (
    matchesTask(title, ["arquitectura", "app router"]) &&
    title.includes("modulos")
  ) {
    const hasGuide = fileHas(
      snapshot,
      "docs/app-router-architecture.md",
      "estructura por modulo",
    );
    const hasPage = hasFile(snapshot, "app/dashboard/roadmap/page.tsx");
    const hasApi = hasFile(snapshot, "app/api/roadmap/route.ts");

    const checks = [hasGuide, hasPage, hasApi].filter(Boolean).length;
    if (checks === 3) {
      return {
        status: "done",
        statusSource: "auto",
        evidence: [
          fileEvidence("docs/app-router-architecture.md", "Guia de arquitectura por modulo."),
          fileEvidence("app/dashboard/roadmap/page.tsx", "Modulo dashboard en App Router."),
          fileEvidence("app/api/roadmap/route.ts", "Ruta API del modulo."),
        ],
        note: "Arquitectura modular App Router detectada.",
      };
    }

    if (checks >= 2) {
      return {
        status: "partial",
        statusSource: "auto",
        evidence: [
          hasGuide ? fileEvidence("docs/app-router-architecture.md") : fileEvidence("app/dashboard/roadmap/page.tsx"),
          hasApi ? fileEvidence("app/api/roadmap/route.ts") : fileEvidence("types/roadmap.ts"),
        ],
        note: "Implementacion parcial de convenciones App Router.",
      };
    }
  }

  if (matchesTask(title, ["capa prisma", "reutilizable"])) {
    const hasWrapper = fileHas(snapshot, "lib/server/prisma-route.ts", "runprismaroute");
    const hasErrorHelper = fileHas(snapshot, "lib/server/prisma-route.ts", "routeerror");
    const routeUsageCount = [
      "app/api/roadmap/route.ts",
      "app/api/roadmap/phases/route.ts",
      "app/api/roadmap/tasks/route.ts",
      "app/api/roadmap/tasks/[taskId]/route.ts",
    ].filter((file) => fileHas(snapshot, file, "runprismaroute")).length;

    if (hasWrapper && hasErrorHelper && routeUsageCount >= 2) {
      return {
        status: "done",
        statusSource: "auto",
        evidence: [
          fileEvidence("lib/server/prisma-route.ts", "Wrapper de respuestas/errores Prisma."),
          fileEvidence("app/api/roadmap/phases/route.ts", "Uso del wrapper en endpoints."),
          fileEvidence("app/api/roadmap/tasks/route.ts", "Uso del wrapper en endpoints."),
        ],
        note: "Capa Prisma reutilizable aplicada en server routes.",
      };
    }

    if (hasWrapper || routeUsageCount > 0) {
      return {
        status: "partial",
        statusSource: "auto",
        evidence: [
          hasWrapper
            ? fileEvidence("lib/server/prisma-route.ts")
            : fileEvidence("app/api/roadmap/route.ts"),
        ],
        note: "Existe base de capa Prisma, pero su adopcion no es total.",
      };
    }
  }

  if (matchesTask(title, ["roadmap", "persistente"]) && title.includes("progreso")) {
    const hasSchema = fileHas(snapshot, "prisma/schema.prisma", /model roadmapphase/i)
      && fileHas(snapshot, "prisma/schema.prisma", /model roadmaptask/i);
    const hasDataService = fileHas(snapshot, "lib/roadmap-data.ts", "getroadmapdata")
      && fileHas(snapshot, "lib/roadmap-data.ts", "progress");
    const hasBoard = fileHas(snapshot, "components/roadmap/RoadmapBoard.tsx", "globalpercent");

    const checks = [hasSchema, hasDataService, hasBoard].filter(Boolean).length;
    if (checks === 3) {
      return {
        status: "done",
        statusSource: "auto",
        evidence: [
          fileEvidence("prisma/schema.prisma", "Modelos persistentes de roadmap."),
          fileEvidence("lib/roadmap-data.ts", "Calculo de progreso por fase/global."),
          fileEvidence("components/roadmap/RoadmapBoard.tsx", "Visualizacion de progreso."),
        ],
        note: "Roadmap persistente y progreso global implementados.",
      };
    }

    if (checks >= 2) {
      return {
        status: "partial",
        statusSource: "auto",
        evidence: [
          hasSchema ? fileEvidence("prisma/schema.prisma") : fileEvidence("lib/roadmap-data.ts"),
          hasBoard ? fileEvidence("components/roadmap/RoadmapBoard.tsx") : fileEvidence("app/api/roadmap/route.ts"),
        ],
        note: "Persistencia y progreso detectados parcialmente.",
      };
    }
  }

  if (matchesTask(title, ["restringir", "edicion", "administradores"])) {
    const hasGuard = fileHas(snapshot, "lib/server/roadmap-access.ts", "requireroadmapeditor");
    const hasAdminEnv = fileHas(snapshot, "lib/roadmap-auth.ts", "roadmap_admin_emails");
    const hasPermissiveFallback = fileHas(
      snapshot,
      "lib/roadmap-auth.ts",
      "if (!admins.size) return true",
    );

    if (hasGuard && hasAdminEnv && !hasPermissiveFallback) {
      return {
        status: "done",
        statusSource: "auto",
        evidence: [
          fileEvidence("lib/server/roadmap-access.ts", "Guard de edicion con 403."),
          fileEvidence("lib/roadmap-auth.ts", "Allowlist de administradores."),
        ],
        note: "Edicion restringida estrictamente a administradores.",
      };
    }

    if (hasGuard && hasAdminEnv) {
      return {
        status: "partial",
        statusSource: "auto",
        evidence: [
          fileEvidence("lib/server/roadmap-access.ts", "Guard editor activo."),
          fileEvidence("lib/roadmap-auth.ts", "Control por ROADMAP_ADMIN_EMAILS."),
        ],
        note: "Existe control admin, pero hay fallback permisivo cuando no hay allowlist.",
      };
    }

    if (hasGuard) {
      return {
        status: "partial",
        statusSource: "auto",
        evidence: [fileEvidence("lib/server/roadmap-access.ts")],
        note: "Hay guard de edicion, falta regla completa de administradores.",
      };
    }
  }

  if (matchesTask(title, ["filtros"]) && (title.includes("busqueda") || title.includes("search"))) {
    const hasUiFilters = fileHas(snapshot, "components/roadmap/RoadmapBoard.tsx", "statusfilter")
      || fileHas(snapshot, "components/roadmap/RoadmapBoard.tsx", "search");
    const hasApiFilters = fileHas(snapshot, "app/api/roadmap/route.ts", "searchparams")
      || fileHas(snapshot, "lib/roadmap-data.ts", "filter");

    if (hasUiFilters && hasApiFilters) {
      return {
        status: "done",
        statusSource: "auto",
        evidence: [
          fileEvidence("components/roadmap/RoadmapBoard.tsx"),
          fileEvidence("app/api/roadmap/route.ts"),
        ],
        note: "Filtros y busqueda de tareas implementados.",
      };
    }

    if (hasUiFilters || hasApiFilters) {
      return {
        status: "partial",
        statusSource: "auto",
        evidence: [
          hasUiFilters
            ? fileEvidence("components/roadmap/RoadmapBoard.tsx")
            : fileEvidence("app/api/roadmap/route.ts"),
        ],
        note: "Solo una parte de filtros/busqueda esta implementada.",
      };
    }

    return {
      status: "pending",
      statusSource: "auto",
      evidence: [],
      note: "No se detectaron filtros por estado ni busqueda en roadmap.",
    };
  }

  if (matchesTask(title, ["pruebas", "integracion"]) && title.includes("roadmap")) {
    const hasRoadmapTestFiles = [...snapshot.files.keys()].some(
      (relativePath) =>
        /\.(test|spec)\.(ts|tsx|js|jsx)$/i.test(relativePath)
        && /roadmap/i.test(relativePath),
    );
    const hasTestSyntax = countFilesWith(snapshot, /(describe\(|it\(|test\()/i) > 0;
    const hasRoadmapMentions = countFilesWith(snapshot, /api\/roadmap|roadmap\/route|roadmap/i) > 0;
    const hasRoadmapTests = hasRoadmapTestFiles && hasTestSyntax && hasRoadmapMentions;

    if (hasRoadmapTests) {
      return {
        status: "done",
        statusSource: "auto",
        evidence: [fileEvidence("tests/*", "Pruebas de integracion detectadas para roadmap.")],
        note: "Pruebas de integracion de roadmap detectadas.",
      };
    }

    return {
      status: "pending",
      statusSource: "auto",
      evidence: [],
      note: "No se detectaron pruebas de integracion para endpoints roadmap.",
    };
  }

  return null;
}

function assessTask(task: RoadmapTaskDto, snapshot: RepoSnapshot): TaskAssessment {
  const knownAssessment = assessKnownTask(task, snapshot);
  if (knownAssessment) return knownAssessment;

  if (task.completed) {
    return {
      status: "done",
      statusSource: "manual",
      evidence: [],
      note: "Marcada manualmente.",
    };
  }

  return {
    status: "pending",
    statusSource: "manual",
    evidence: [],
    note: null,
  };
}

function clampPercent(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
}

function computeProgress(tasks: RoadmapTaskDto[]): RoadmapPhaseProgressDto {
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

function computeGlobalProgress(phases: RoadmapPhaseDto[]): RoadmapGlobalProgressDto {
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

export async function analyzeRoadmapPhases(phases: RoadmapPhaseDto[]): Promise<{
  phases: RoadmapPhaseDto[];
  progress: RoadmapGlobalProgressDto;
  source: RoadmapSourceDto;
  evaluatedAt: string;
}> {
  const snapshot = await getRepoSnapshot();
  const hasDatabasePhases = phases.length > 0;
  const hasMarkdownRoadmap = hasFile(snapshot, "docs/roadmap-status.md");
  const hasSeedRoadmap = hasFile(snapshot, "prisma/seed.js");

  const source: RoadmapSourceDto = hasDatabasePhases
    ? { type: "database", location: "RoadmapPhase/RoadmapTask (Prisma)" }
    : hasMarkdownRoadmap
      ? { type: "markdown", location: "docs/roadmap-status.md" }
      : hasSeedRoadmap
        ? { type: "embedded", location: "prisma/seed.js" }
        : { type: "unknown", location: "No se detecto roadmap estructurado" };

  const analyzedPhases = phases.map((phase) => {
    const tasks = phase.tasks.map((task) => {
      const assessment = assessTask(task, snapshot);
      return {
        ...task,
        completed: assessment.status === "done",
        status: assessment.status,
        statusSource: assessment.statusSource,
        evidence: assessment.evidence,
        note: assessment.note,
      };
    });

    return {
      ...phase,
      tasks,
      progress: computeProgress(tasks),
    };
  });

  return {
    phases: analyzedPhases,
    progress: computeGlobalProgress(analyzedPhases),
    source,
    evaluatedAt: new Date().toISOString(),
  };
}
