import { getRoadmapData } from "../../../lib/roadmap-data";
import { requireRoadmapViewer } from "../../../lib/server/roadmap-access";
import { runPrismaRoute } from "../../../lib/server/prisma-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return runPrismaRoute(
    async () => {
      const { canEdit } = await requireRoadmapViewer();
      const data = await getRoadmapData();
      return { data, permissions: { canEdit } };
    },
    { fallbackError: "No se pudo cargar el roadmap" },
  );
}
