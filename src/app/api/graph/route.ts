// src/app/api/graph/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/auth/get-session";
import { prisma } from "@/lib/db/prisma";
import { GraphData, EntityType } from "@/types";

const NODE_COLORS: Record<EntityType, string> = {
  PERSON: "#e07a5f",
  PROJECT: "#2a9d8f",
  ORGANIZATION: "#f2cc8f",
  PLACE: "#b7b0a6",
  TRAVEL: "#f2cc8f",
  HEALTH: "#e07a5f",
  TOPIC: "#6f665a",
  EVENT: "#f2cc8f",
};

const NODE_SIZE: Record<EntityType, number> = {
  PERSON: 8,
  PROJECT: 10,
  TOPIC: 5,
  ORGANIZATION: 7,
  PLACE: 6,
  TRAVEL: 6,
  HEALTH: 6,
  EVENT: 5,
};

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getCachedSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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
      },
      include: {
        fromEntity: true,
        toEntity: true,
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
    return NextResponse.json(
      { error: "Failed to generate graph" },
      { status: 500 }
    );
  }
}
