import { requireRoadmapAccess } from "../roadmap-auth";
import { routeError } from "./prisma-route";

export async function requireRoadmapViewer() {
  const { user, canEdit } = await requireRoadmapAccess();
  if (!user) {
    routeError(401, "No autenticado");
  }
  if (user?.role !== "owner") {
    routeError(403, "El roadmap es exclusivo para el propietario");
  }

  return { user, canEdit };
}

export async function requireRoadmapEditor() {
  const { user, canEdit } = await requireRoadmapViewer();
  return { user, canEdit };
}
