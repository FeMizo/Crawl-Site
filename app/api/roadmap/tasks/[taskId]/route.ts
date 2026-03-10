import { NextRequest } from "next/server";
import {
  deleteRoadmapTask,
  getRoadmapData,
  updateRoadmapTaskCompletion,
} from "../../../../../lib/roadmap-data";
import { requireRoadmapEditor } from "../../../../../lib/server/roadmap-access";
import { routeError, runPrismaRoute } from "../../../../../lib/server/prisma-route";

export const runtime = "nodejs";

type Params = {
  params: {
    taskId: string;
  };
};

export async function PATCH(request: NextRequest, context: Params) {
  return runPrismaRoute(
    async () => {
      await requireRoadmapEditor();

      const taskId = String(context.params.taskId || "").trim();
      if (!taskId) {
        routeError(400, "taskId invalido");
      }

      const payload = await request.json().catch(() => null);
      if (typeof payload?.completed !== "boolean") {
        routeError(400, "completed invalido");
      }

      const result = await updateRoadmapTaskCompletion(taskId, payload.completed);
      if (result.notFound) {
        routeError(404, "Tarea no encontrada");
      }

      const data = await getRoadmapData();
      return { data };
    },
    { fallbackError: "No se pudo actualizar la tarea" },
  );
}

export async function DELETE(_request: NextRequest, context: Params) {
  return runPrismaRoute(
    async () => {
      await requireRoadmapEditor();

      const taskId = String(context.params.taskId || "").trim();
      if (!taskId) {
        routeError(400, "taskId invalido");
      }

      const result = await deleteRoadmapTask(taskId);
      if (result.notFound) {
        routeError(404, "Tarea no encontrada");
      }

      const data = await getRoadmapData();
      return { data };
    },
    { fallbackError: "No se pudo eliminar la tarea" },
  );
}
