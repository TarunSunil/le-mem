// src/app/api/memory/search/route.ts
import { getCachedSession } from "@/lib/auth/get-session";
import { prisma } from "@/lib/db/prisma";
import { embedText } from "@/lib/ai/embed";
import { rankMemoriesForQuery, tokenizeSearchText } from "@/lib/memoryHelpers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { query, limit = 10 } = await request.json();

    const session = await getCachedSession();
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

    // Generate embedding for query (optional). If embedding generation fails
    // or is not configured, fall back to a text-only search.
    let queryEmbedding: number[] | null = null;
    try {
      const emb = await embedText(query);
      if (emb && emb.length > 0) queryEmbedding = emb;
      else queryEmbedding = null;
    } catch (e) {
      console.warn("Embedding generation skipped or failed:", e);
      queryEmbedding = null;
    }

    let memories;
    if (queryEmbedding) {
      try {
        const vector = `[${queryEmbedding.join(",")}]`;
        const annCandidates = await prisma.$queryRaw<
          Array<{
            id: string;
            content: string;
            rawInput: string;
            summary: string | null;
            tags: string[] | null;
            createdAt: Date;
            embedding: string | null;
            entities: unknown;
          }>
        >`
          SELECT
            m.id,
            m.content,
            m."rawInput",
            m.summary,
            m.tags,
            m."createdAt",
            m.embedding::text AS embedding,
            COALESCE(
              json_agg(json_build_object('entity', json_build_object('name', e.name)))
                FILTER (WHERE e.id IS NOT NULL),
              '[]'
            ) AS entities
          FROM "Memory" m
          LEFT JOIN "MemoryEntity" me ON me."memoryId" = m.id
          LEFT JOIN "Entity" e ON e.id = me."entityId"
          WHERE m."userId" = ${user.id} AND m.embedding IS NOT NULL
          GROUP BY m.id, m.content, m."rawInput", m.summary, m.tags, m."createdAt", m.embedding
          ORDER BY m.embedding <=> ${vector}::vector
          LIMIT 50
        `;

        memories = annCandidates.map((memory) => ({
          ...memory,
          embedding: memory.embedding ? JSON.parse(memory.embedding) : null,
          entities:
            typeof memory.entities === "string"
              ? JSON.parse(memory.entities)
              : Array.isArray(memory.entities)
                ? memory.entities
                : [],
        }));
      } catch (error) {
        console.warn("pgvector ANN search failed, falling back to Prisma search:", error);
      }
    }

    memories ??= await prisma.memory.findMany({
      where: {
        userId: user.id,
      },
      take: 300,
      include: {
        entities: {
          include: {
            entity: true,
          },
        },
      },
    });

    const rankedMemories = rankMemoriesForQuery(query, memories, queryEmbedding, limit);

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

    const queryTokens = tokenizeSearchText(query);
    const rankedEntities = entities.filter((entity) => {
      const entityText = `${entity.name} ${entity.summary || ""}`.toLowerCase();
      return queryTokens.some((token) => entityText.includes(token));
    });

    const results = [
      ...rankedMemories.map((memory) => ({
        id: memory.id,
        type: "MEMORY",
        title: memory.summary || memory.content.slice(0, 64),
        summary: memory.summary || memory.content,
      })),
      ...rankedEntities.map((entity) => ({
        id: entity.id,
        type: entity.type,
        name: entity.name,
        title: entity.name,
        summary: entity.summary || entity.name,
      })),
    ];

    // Group results by type
    const people = rankedEntities.filter((e: { type: string }) => e.type === "PERSON");
    const projects = rankedEntities.filter((e: { type: string }) => e.type === "PROJECT");
    const places = rankedEntities.filter((e: { type: string }) => e.type === "PLACE");
    const topics = rankedEntities.filter((e: { type: string }) => e.type === "TOPIC");

    return NextResponse.json({
      results,
      memories: rankedMemories,
      entities: {
        people,
        projects,
        places,
        topics,
      },
      usedEmbedding: Boolean(queryEmbedding),
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
