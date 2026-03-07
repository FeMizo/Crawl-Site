import { NextRequest, NextResponse } from "next/server";
import {
  createRoadmapTask,
  getRoadmapData,
  normalizeTaskTitle,
} from "../../../../lib/roadmap-data";
import { requireRoadmapAccess } from "../../../../lib/roadmap-auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { user, canEdit } = await requireRoadmapAccess();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  if (!canEdit) {
    return NextResponse.json(
      { error: "Solo administradores pueden editar el roadmap" },
      { status: 403 },
    );
  }

  const payload = await request.json().catch(() => null);
  const phaseId = String(payload?.phaseId ?? "").trim();
  const title = normalizeTaskTitle(payload?.title);

  if (!phaseId) {
    return NextResponse.json({ error: "phaseId es obligatorio" }, { status: 400 });
  }

  if (!title) {
    return NextResponse.json(
      { error: "El titulo de la tarea es obligatorio" },
      { status: 400 },
    );
  }

  const result = await createRoadmapTask({ phaseId, title });

  if (result.notFound) {
    return NextResponse.json({ error: "Fase no encontrada" }, { status: 404 });
  }

  const data = await getRoadmapData();
  return NextResponse.json({ data }, { status: 201 });
}
