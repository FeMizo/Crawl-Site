import { requireRoadmapAccess } from "../roadmap-auth";
import { routeError } from "./prisma-route";

export async function requireRoadmapViewer() {
  const { user, canEdit } = await requireRoadmapAccess();
  if (!user) {
    routeError(401, "No autenticado");
  }

  return { user, canEdit };
}

export async function requireRoadmapEditor() {
  const { user, canEdit } = await requireRoadmapViewer();
  if (!canEdit) {
    routeError(403, "Solo administradores pueden editar el roadmap");
  }

  return { user, canEdit };
}
