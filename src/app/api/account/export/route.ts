import { getCachedSession } from "@/lib/auth/get-session";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";

export async function GET() {
  const session = await getCachedSession();
  if (!session?.user?.email) {
    return apiError("Unauthorized", 401);
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) {
    return apiError("User not found", 404);
  }

  const [memories, entities, relations, memoryEntities, suggestions, traces] = await Promise.all([
    prisma.memory.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
    prisma.entity.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
    prisma.entityRelation.findMany({
      where: { fromEntity: { userId }, toEntity: { userId } },
      orderBy: { id: "asc" },
    }),
    prisma.memoryEntity.findMany({
      where: { memory: { userId: user.id } },
      orderBy: [{ memoryId: "asc" }, { entityId: "asc" }],
    }),
    prisma.agentSuggestion.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
    prisma.agentTrace.findMany({ where: { userId: user.id }, orderBy: [{ sessionId: "asc" }, { step: "asc" }] }),
  ]);

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    memories,
    entities,
    relations,
    memoryEntities,
    suggestions,
    traces,
  });
}