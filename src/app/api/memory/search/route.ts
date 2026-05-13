// src/app/api/memory/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { embedText } from "@/lib/ai/embed";

export async function POST(request: NextRequest) {
  try {
    const { query, userId, limit = 10 } = await request.json();

    if (!query || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate embedding for query
    const queryEmbedding = await embedText(query);

    if (!queryEmbedding || queryEmbedding.length === 0) {
      return NextResponse.json(
        { error: "Failed to generate query embedding" },
        { status: 500 }
      );
    }

    // Search memories using raw SQL for pgvector
    // Note: In a real production environment with pgvector, we'd use:
    // const memories = await prisma.$queryRaw`
    //   SELECT *, embedding <=> $1::vector AS distance
    //   FROM "Memory"
    //   WHERE "userId" = $2
    //   ORDER BY distance ASC
    //   LIMIT $3
    // `;
    // For now, we'll do a simple text search

    const memories = await prisma.memory.findMany({
      where: {
        userId,
        content: {
          contains: query,
          mode: "insensitive",
        },
      },
      take: limit,
      include: {
        entities: {
          include: {
            entity: true,
          },
        },
      },
    });

    // Search entities
    const entities = await prisma.entity.findMany({
      where: {
        userId,
        name: {
          contains: query,
          mode: "insensitive",
        },
      },
      take: limit,
    });

    // Group results by type
    const people = entities.filter((e: { type: string }) => e.type === "PERSON");
    const projects = entities.filter((e: { type: string }) => e.type === "PROJECT");
    const places = entities.filter((e: { type: string }) => e.type === "PLACE");
    const topics = entities.filter((e: { type: string }) => e.type === "TOPIC");

    return NextResponse.json({
      memories,
      entities: {
        people,
        projects,
        places,
        topics,
      },
      success: true,
    });
  } catch (error) {
    console.error("Search failed:", error);
    return NextResponse.json(
      { error: "Search failed", details: String(error) },
      { status: 500 }
    );
  }
}
