import { prisma } from "@/lib/db/prisma";
import { embedText } from "@/lib/ai/embed";
import { rankMemoriesForQuery } from "@/lib/memoryHelpers";

export type MemorySearchResult = {
  id: string;
  content: string;
  rawInput?: string;
  summary?: string | null;
  tags?: string[] | null;
  createdAt: Date;
  embedding?: number[] | null;
  pinned: boolean;
  entities: Array<{ entity?: { name?: string | null } | null }>;
};

export async function searchMemories(
  userId: string,
  query: string,
  limit = 10
): Promise<{ memories: MemorySearchResult[]; memoryContext: string }> {
  let queryEmbedding: number[] | null = null;
  try {
    const emb = await embedText(query);
    if (emb && emb.length > 0) queryEmbedding = emb;
  } catch {
    // fall through to recency sort
  }

  type RawRow = {
    id: string; content: string; rawInput: string; summary: string | null;
    tags: string[] | null; createdAt: Date; embedding: string | null;
    pinned: boolean; entities: unknown;
  };

  let rawMemories: RawRow[] = [];

  if (queryEmbedding) {
    const vectorStr = `[${queryEmbedding.join(",")}]`;
    rawMemories = await prisma.$queryRaw<RawRow[]>`
      SELECT m.id, m.content, m."rawInput", m.summary, m.tags, m."createdAt",
             m.pinned, m.embedding::text AS embedding,
             COALESCE(json_agg(json_build_object('entity',json_build_object('name',e.name)))
               FILTER (WHERE e.id IS NOT NULL),'[]') AS entities
      FROM "Memory" m
      LEFT JOIN "MemoryEntity" me ON me."memoryId" = m.id
      LEFT JOIN "Entity" e ON e.id = me."entityId"
      WHERE m."userId" = ${userId}
      GROUP BY m.id,m.content,m."rawInput",m.summary,m.tags,m."createdAt",m.pinned,m.embedding
      ORDER BY CASE WHEN m.embedding IS NOT NULL
                    THEN m.embedding <=> ${vectorStr}::vector ELSE 1.0 END
      LIMIT 50
    `;
  } else {
    rawMemories = await prisma.$queryRaw<RawRow[]>`
      SELECT m.id, m.content, m."rawInput", m.summary, m.tags, m."createdAt",
             m.pinned, m.embedding::text AS embedding,
             COALESCE(json_agg(json_build_object('entity',json_build_object('name',e.name)))
               FILTER (WHERE e.id IS NOT NULL),'[]') AS entities
      FROM "Memory" m
      LEFT JOIN "MemoryEntity" me ON me."memoryId" = m.id
      LEFT JOIN "Entity" e ON e.id = me."entityId"
      WHERE m."userId" = ${userId}
      GROUP BY m.id,m.content,m."rawInput",m.summary,m.tags,m."createdAt",m.pinned,m.embedding
      ORDER BY m."createdAt" DESC
      LIMIT 300
    `;
  }

  const parsed: MemorySearchResult[] = rawMemories.map((m) => ({
    ...m,
    embedding: m.embedding ? (JSON.parse(m.embedding) as number[]) : null,
    entities: typeof m.entities === "string"
      ? JSON.parse(m.entities)
      : Array.isArray(m.entities) ? m.entities : [],
  }));

  const top = rankMemoriesForQuery(query, parsed, queryEmbedding, limit);

  const memoryContext = top.map((m) => {
    const date = m.createdAt
      ? new Date(m.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      : "";
    return `- ${m.pinned ? "(pinned) " : ""}${date ? `[${date}] ` : ""}${m.summary ?? m.content.slice(0, 300)}`;
  }).join("\n");

  return { memories: top, memoryContext };
}