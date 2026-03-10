import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

type JsonPayload = Record<string, unknown>;

type RunPrismaRouteOptions = {
  successStatus?: number;
  fallbackError?: string;
};

export class RouteError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "RouteError";
    this.status = status;
  }
}

export function routeError(status: number, message: string): never {
  throw new RouteError(status, message);
}

function mapPrismaError(error: unknown): RouteError | null {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return new RouteError(404, "Recurso no encontrado");
    }

    if (error.code === "P2002") {
      return new RouteError(409, "Registro duplicado");
    }
  }

  return null;
}

export async function runPrismaRoute(
  handler: () => Promise<JsonPayload>,
  options: RunPrismaRouteOptions = {},
): Promise<NextResponse> {
  try {
    const payload = await handler();
    return NextResponse.json(payload, { status: options.successStatus ?? 200 });
  } catch (error) {
    if (error instanceof RouteError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const prismaError = mapPrismaError(error);
    if (prismaError) {
      return NextResponse.json(
        { error: prismaError.message },
        { status: prismaError.status },
      );
    }

    return NextResponse.json(
      { error: options.fallbackError || "Error interno del servidor" },
      { status: 500 },
    );
  }
}
