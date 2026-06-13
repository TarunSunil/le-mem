import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withGeminiFallback } from "@/lib/ai/gemini-fallback";

const CRON_SECRET = process.env.CRON_SECRET ?? "";
const SIMILARITY_THRESHOLD = 0.92;
const INACTIVE_DAYS = 7;
const DORMANT_DAYS = 30;

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB) || 1);
}

export async function POST(req: NextRequest) {
  // Auth check — must match CRON_SECRET header
  const secret = req.headers.get("x-cron-secret");
  if (!secret || secret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = {
    usersProcessed: 0,
    contradictions: 0,
    consolidations: 0,
    reminders: 0,
    errors: [] as string[],
  };

  try {
    // Only process users active in the last INACTIVE_DAYS days
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - INACTIVE_DAYS);

    const activeUsers = await prisma.user.findMany({
      where: {
        memories: {
          some: { createdAt: { gte: cutoff } },
        },
      },
      select: { id: true },
    });

    for (const { id: userId } of activeUsers) {
      try {
        await processUser(userId, results);
        results.usersProcessed++;
      } catch (err) {
        results.errors.push(`user ${userId}: ${String(err)}`);
      }
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ...results });
}

async function processUser(
  userId: string,
  results: { contradictions: number; consolidations: number; reminders: number }
) {
  // Fetch all memories with embeddings
  type RawMemory = {
    id: string;
    content: string;
    summary: string | null;
    embedding: string | null;
    createdAt: Date;
    entities: unknown;
  };

  const rawMemories = await prisma.$queryRaw<RawMemory[]>`
    SELECT m.id, m.content, m.summary, m."createdAt",
           m.embedding::text AS embedding,
           COALESCE(
             json_agg(json_build_object('name', e.name))
             FILTER (WHERE e.id IS NOT NULL),
             '[]'
           ) AS entities
    FROM "Memory" m
    LEFT JOIN "MemoryEntity" me ON me."memoryId" = m.id
    LEFT JOIN "Entity" e ON e.id = me."entityId"
    WHERE m."userId" = ${userId}
    GROUP BY m.id, m.content, m.summary, m."createdAt", m.embedding
    ORDER BY m."createdAt" DESC
    LIMIT 500
  `;

  const memories = rawMemories.map((m) => ({
    ...m,
    embedding: m.embedding ? (JSON.parse(m.embedding) as number[]) : null,
    entities: (
      typeof m.entities === "string" ? JSON.parse(m.entities) : m.entities
    ) as Array<{ name: string }>,
  }));

  if (memories.length < 3) return;

  await withGeminiFallback(async (genAI) => {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // ── Pass 1: Contradiction detection ──────────────────────────
    // Group by entity name
    const entityMap = new Map<string, typeof memories>();
    for (const mem of memories) {
      for (const ent of mem.entities) {
        if (!ent.name) continue;
        const existing = entityMap.get(ent.name) ?? [];
        existing.push(mem);
        entityMap.set(ent.name, existing);
      }
    }

    for (const [entityName, mems] of entityMap.entries()) {
      if (mems.length < 2) continue;
      const snippets = mems
        .slice(0, 8)
        .map((m, i) => `${i + 1}. ${m.summary ?? m.content.slice(0, 200)}`)
        .join("\n");

      const prompt = `Do any of these memories about "${entityName}" contradict each other?
Return ONLY valid JSON: {"contradiction": boolean, "description": string, "memoryIds": string[]}
No markdown, no explanation outside JSON.

Memories:
${snippets}

Memory IDs (same order): ${mems
        .slice(0, 8)
        .map((m) => m.id)
        .join(", ")}`;

      try {
        const res = await model.generateContent(prompt);
        const text = res.response.text().replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(text) as {
          contradiction: boolean;
          description: string;
          memoryIds: string[];
        };

        if (parsed.contradiction && parsed.memoryIds?.length >= 2) {
          await prisma.agentSuggestion.create({
            data: {
              userId,
              type: "contradiction",
              title: `Conflicting memories about ${entityName}`,
              body: parsed.description,
              memoryIds: parsed.memoryIds,
            },
          });
          results.contradictions++;
        }
      } catch {
        // skip malformed response
      }
    }

    // ── Pass 2: Consolidation (near-duplicate clusters) ──────────
    const withEmbeddings = memories.filter((m) => m.embedding !== null);
    const grouped = new Set<string>();

    for (let i = 0; i < withEmbeddings.length; i++) {
      if (grouped.has(withEmbeddings[i].id)) continue;
      const cluster = [withEmbeddings[i]];

      for (let j = i + 1; j < withEmbeddings.length; j++) {
        if (grouped.has(withEmbeddings[j].id)) continue;
        const sim = cosineSimilarity(
          withEmbeddings[i].embedding!,
          withEmbeddings[j].embedding!
        );
        if (sim >= SIMILARITY_THRESHOLD) {
          cluster.push(withEmbeddings[j]);
          grouped.add(withEmbeddings[j].id);
        }
      }

      if (cluster.length >= 3) {
        grouped.add(withEmbeddings[i].id);
        const snippets = cluster
          .map((m) => m.summary ?? m.content.slice(0, 200))
          .join("\n---\n");

        const consolidatePrompt = `These memory entries are very similar. Write a single consolidated summary (2-3 sentences) that captures all unique information:

${snippets}

Return ONLY the summary text.`;

        try {
          const res = await model.generateContent(consolidatePrompt);
          const consolidated = res.response.text().trim();

          await prisma.agentSuggestion.create({
            data: {
              userId,
              type: "consolidation",
              title: `${cluster.length} similar memories can be merged`,
              body: consolidated,
              memoryIds: cluster.map((m) => m.id),
            },
          });
          results.consolidations++;
        } catch {
          // skip
        }
      }
    }

    // ── Pass 3: Surface dormant high-value memories ──────────────
    const dormantCutoff = new Date();
    dormantCutoff.setDate(dormantCutoff.getDate() - DORMANT_DAYS);

    const dormant = memories.filter(
      (m) => new Date(m.createdAt) < dormantCutoff
    );

    // High-connection = appears in many entity clusters
    const entityCountMap = new Map<string, number>();
    for (const mem of dormant) {
      entityCountMap.set(mem.id, mem.entities.length);
    }

    const highConnection = dormant
      .filter((m) => (entityCountMap.get(m.id) ?? 0) >= 2)
      .slice(0, 3);

    for (const mem of highConnection) {
      // Skip if we already created a suggestion for this memory recently
      const existing = await prisma.agentSuggestion.findFirst({
        where: {
          userId,
          type: "reminder",
          memoryIds: { has: mem.id },
          createdAt: { gte: dormantCutoff },
        },
      });
      if (existing) continue;

      await prisma.agentSuggestion.create({
        data: {
          userId,
          type: "reminder",
          title: "You might want to revisit this",
          body: mem.summary ?? mem.content.slice(0, 300),
          memoryIds: [mem.id],
        },
      });
      results.reminders++;
    }
  });
}