import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

type JwtPayload = {
  userId?: string;
};

export type RoadmapActor = {
  id: string;
  email: string;
  name: string | null;
};

type AccessResult = {
  user: RoadmapActor | null;
  canEdit: boolean;
};

function getAdminEmails(): Set<string> {
  const raw = process.env.ROADMAP_ADMIN_EMAILS || "";
  const values = raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  return new Set(values);
}

export function canEditRoadmap(actor: RoadmapActor | null): boolean {
  if (!actor) return false;
  const admins = getAdminEmails();
  if (!admins.size) return false;
  return admins.has(actor.email.toLowerCase());
}

export async function requireRoadmapAccess(): Promise<AccessResult> {
  const token = cookies().get("auth_token")?.value;
  if (!token) return { user: null, canEdit: false };

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "change-this-local-secret",
    ) as JwtPayload;

    if (!decoded?.userId) return { user: null, canEdit: false };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) return { user: null, canEdit: false };

    const actor: RoadmapActor = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    return {
      user: actor,
      canEdit: canEditRoadmap(actor),
    };
  } catch {
    return { user: null, canEdit: false };
  }
}
