import { NextResponse } from "next/server";
import { getRoadmapData } from "../../../lib/roadmap-data";
import { requireRoadmapAccess } from "../../../lib/roadmap-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { user, canEdit } = await requireRoadmapAccess();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const data = await getRoadmapData();
  return NextResponse.json({ data, permissions: { canEdit } });
}
