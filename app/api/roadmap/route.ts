import { getRoadmapData } from "../../../lib/roadmap-data";
import { requireRoadmapViewer } from "../../../lib/server/roadmap-access";
import { runPrismaRoute } from "../../../lib/server/prisma-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return runPrismaRoute(
    async () => {
      const { canEdit } = await requireRoadmapViewer();
      const url = new URL(request.url);
      const status = url.searchParams.get("status") || "all";
      const query = url.searchParams.get("q") || "";
      const phaseId = url.searchParams.get("phaseId") || "";
      const data = await getRoadmapData({
        status: status as "all" | "done" | "partial" | "pending",
        query,
        phaseId,
      });
      return { data, permissions: { canEdit } };
    },
    { fallbackError: "No se pudo cargar el roadmap" },
  );
}
