// src/app/api/graph/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/auth/get-session";
import { prisma } from "@/lib/db/prisma";
import { GraphData, EntityType } from "@/types";
import { NODE_COLORS, NODE_SIZE } from "@/lib/graph/theme";
import { apiError } from "@/lib/api-error";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getCachedSession();
    if (!session?.user?.email) {
      return apiError("Unauthorized", 401);
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return apiError("User not found", 404);
    }

    const userId = user.id;

    // Fetch all entities for this user
    const entities = await prisma.entity.findMany({
      where: { userId },
    });

    // Fetch all relationships
    const relations = await prisma.entityRelation.findMany({
      where: {
        fromEntity: {
          userId,
        },
        toEntity: {
          userId,
        },
      },
      select: {
        fromEntityId: true,
        toEntityId: true,
        label: true,
        strength: true,
      },
    });

    // Build graph data
    const nodes = entities.map((entity: (typeof entities)[number]) => ({
      id: entity.id,
      name: entity.name,
      type: entity.type as EntityType,
      val: NODE_SIZE[entity.type as EntityType] || 5,
      color: NODE_COLORS[entity.type as EntityType],
    }));

    const links = relations.map((rel: (typeof relations)[number]) => ({
      source: rel.fromEntityId,
      target: rel.toEntityId,
      label: rel.label,
      strength: rel.strength,
    }));

    const graphData: GraphData = {
      nodes,
      links,
    };

    return NextResponse.json(graphData, {
      headers: {
        "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("Graph generation failed:", error);
    return apiError("Failed to generate graph", 500, String(error));
  }
}
