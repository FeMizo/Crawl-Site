import { NextRequest, NextResponse } from "next/server";
import {
  deleteRoadmapTask,
  getRoadmapData,
  updateRoadmapTaskCompletion,
} from "../../../../../lib/roadmap-data";
import { requireRoadmapAccess } from "../../../../../lib/roadmap-auth";

export const runtime = "nodejs";

type Params = {
  params: {
    taskId: string;
  };
};

export async function PATCH(request: NextRequest, context: Params) {
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

  const taskId = String(context.params.taskId || "").trim();
  if (!taskId) {
    return NextResponse.json({ error: "taskId invalido" }, { status: 400 });
  }

  const payload = await request.json().catch(() => null);
  const completed = Boolean(payload?.completed);
  const result = await updateRoadmapTaskCompletion(taskId, completed);

  if (result.notFound) {
    return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
  }

  const data = await getRoadmapData();
  return NextResponse.json({ data });
}

export async function DELETE(_request: NextRequest, context: Params) {
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

  const taskId = String(context.params.taskId || "").trim();
  if (!taskId) {
    return NextResponse.json({ error: "taskId invalido" }, { status: 400 });
  }

  const result = await deleteRoadmapTask(taskId);

  if (result.notFound) {
    return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
  }

  const data = await getRoadmapData();
  return NextResponse.json({ data });
}
