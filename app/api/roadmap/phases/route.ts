import { NextRequest, NextResponse } from "next/server";
import {
  createRoadmapPhase,
  getRoadmapData,
  normalizePhaseDescription,
  normalizePhaseTitle,
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
  const title = normalizePhaseTitle(payload?.title);
  const description = normalizePhaseDescription(payload?.description);

  if (!title) {
    return NextResponse.json(
      { error: "El titulo de la fase es obligatorio" },
      { status: 400 },
    );
  }

  await createRoadmapPhase({ title, description });
  const data = await getRoadmapData();
  return NextResponse.json({ data }, { status: 201 });
}
