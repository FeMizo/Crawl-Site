import { NextRequest } from "next/server";
import {
  createRoadmapTask,
  getRoadmapData,
  normalizeTaskTitle,
} from "../../../../lib/roadmap-data";
import { requireRoadmapEditor } from "../../../../lib/server/roadmap-access";
import { routeError, runPrismaRoute } from "../../../../lib/server/prisma-route";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return runPrismaRoute(
    async () => {
      await requireRoadmapEditor();

      const payload = await request.json().catch(() => null);
      const phaseId = String(payload?.phaseId ?? "").trim();
      const title = normalizeTaskTitle(payload?.title);

      if (!phaseId) {
        routeError(400, "phaseId es obligatorio");
      }

      if (!title) {
        routeError(400, "El titulo de la tarea es obligatorio");
      }

      const result = await createRoadmapTask({ phaseId, title });
      if (result.notFound) {
        routeError(404, "Fase no encontrada");
      }

      const data = await getRoadmapData();
      return { data };
    },
    {
      successStatus: 201,
      fallbackError: "No se pudo crear la tarea",
    },
  );
}
