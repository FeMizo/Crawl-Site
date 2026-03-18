import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
const { canEditContent, getEffectiveRole, getAssignedRole } = require("./user-roles");

type JwtPayload = {
  userId?: string;
};

export type RoadmapActor = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  assignedRole: string;
};

type AccessResult = {
  user: RoadmapActor | null;
  canEdit: boolean;
};

export function canEditRoadmap(actor: RoadmapActor | null): boolean {
  return canEditContent(actor);
}

export async function requireRoadmapAccess(): Promise<AccessResult> {
  const token = cookies().get("auth_token")?.value;
  if (!token) return { user: null, canEdit: false };

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      // In production this should be required; warn in case env is missing
      console.warn("Warning: JWT_SECRET not set for roadmap access checks");
    }
    const decoded = jwt.verify(token, secret as string) as JwtPayload;

    if (!decoded?.userId) return { user: null, canEdit: false };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) return { user: null, canEdit: false };

    const actor: RoadmapActor = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: getEffectiveRole(user),
      assignedRole: getAssignedRole(user),
    };

    return {
      user: actor,
      canEdit: canEditRoadmap(actor),
    };
  } catch {
    return { user: null, canEdit: false };
  }
}
