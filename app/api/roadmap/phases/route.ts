import { NextRequest } from "next/server";
import {
  createRoadmapPhase,
  getRoadmapData,
  normalizePhaseDescription,
  normalizePhaseTitle,
} from "../../../../lib/roadmap-data";
import { requireRoadmapEditor } from "../../../../lib/server/roadmap-access";
import { routeError, runPrismaRoute } from "../../../../lib/server/prisma-route";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return runPrismaRoute(
    async () => {
      await requireRoadmapEditor();

      const payload = await request.json().catch(() => null);
      const title = normalizePhaseTitle(payload?.title);
      const description = normalizePhaseDescription(payload?.description);

      if (!title) {
        routeError(400, "El titulo de la fase es obligatorio");
      }

      await createRoadmapPhase({ title, description });
      const data = await getRoadmapData();
      return { data };
    },
    {
      successStatus: 201,
      fallbackError: "No se pudo crear la fase",
    },
  );
}
