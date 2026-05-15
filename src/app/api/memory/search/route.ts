// src/app/api/memory/search/route.ts
import { authOptions } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { embedText } from "@/lib/ai/embed";
import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { query, limit = 10 } = await request.json();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!query) {
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
        userId: user.id,
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
        userId: user.id,
        name: {
          contains: query,
          mode: "insensitive",
        },
      },
      take: limit,
    });

    const results = [
      ...memories.map((memory) => ({
        id: memory.id,
        type: "MEMORY",
        title: memory.summary || memory.content.slice(0, 64),
        summary: memory.summary || memory.content,
      })),
      ...entities.map((entity) => ({
        id: entity.id,
        type: entity.type,
        name: entity.name,
        title: entity.name,
        summary: entity.summary || entity.name,
      })),
    ];

    // Group results by type
    const people = entities.filter((e: { type: string }) => e.type === "PERSON");
    const projects = entities.filter((e: { type: string }) => e.type === "PROJECT");
    const places = entities.filter((e: { type: string }) => e.type === "PLACE");
    const topics = entities.filter((e: { type: string }) => e.type === "TOPIC");

    return NextResponse.json({
      results,
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
