// src/app/api/memory/ingest/route.ts
import { getCachedSession } from "@/lib/auth/get-session";
import { prisma } from "@/lib/db/prisma";
import { embedMultiple } from "@/lib/ai/embed";
import { ingestPipeline } from "@/lib/ai/ingest-pipeline";
import { isQuestionLike, makeMemoryTitle } from "@/lib/memoryHelpers";
import { ContentType } from "@/types";
import { apiError } from "@/lib/api-error";
import { checkRateLimit } from "@/lib/rateLimit";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const {
      content,
      contentType = "TEXT",
      fileUrl,
      sourceUrl,
    } = await request.json();

    const session = await getCachedSession();
    if (!session?.user?.email) {
      return apiError("Unauthorized", 401);
    }

    if (!checkRateLimit(`ingest:${session.user.email}`)) {
      return apiError("Too many requests. Please wait a moment.", 429);
    }

    let user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      // Create a lightweight user record when one doesn't exist yet.
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user?.name ?? undefined,
        },
      });
    }

    if (!content || typeof content !== "string") {
      return apiError("Missing content", 400);
    }

    if (content.length > 10_000) {
      return apiError("Content too long (max 10,000 chars)", 413);
    }

    const pipeline = await ingestPipeline(content);
    const normalizedFacts = pipeline.facts
      .map((fact) => ({
        ...fact,
        text: String(fact.text || "").replace(/\s+/g, " ").trim(),
      }))
      .filter((fact) => fact.text.length > 0);

    const seen = new Set<string>();
    const dedupedFacts = normalizedFacts.filter((fact) => {
      const key = fact.text.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const usableFacts = dedupedFacts.filter((fact) => !isQuestionLike(fact.text));

    if (usableFacts.length === 0) {
      const reason = isQuestionLike(content) ? "question-like" : "no-durable-facts";
      return NextResponse.json({ skipped: true, reason });
    }

    const needsEmbedding = (text: string) => text.length > 80;
    const factsToEmbed = usableFacts.filter((fact) => needsEmbedding(fact.text));
    const embeddings = await embedMultiple(factsToEmbed.map((fact) => fact.text));
    const embeddingMap = new Map<string, number[]>();

    factsToEmbed.forEach((fact, index) => {
      const embedding = embeddings[index] || [];
      if (embedding.length > 0) {
        embeddingMap.set(fact.text, embedding);
      }
    });

    const created: Array<{ memoryId: string; entitiesFound: unknown[] }> = [];

    await Promise.all(usableFacts.map(async (fact) => {
      const embedding = embeddingMap.get(fact.text) ?? [];
      const extractedData = {
        people: fact.entities?.people ?? [],
        organizations: fact.entities?.organizations ?? [],
        places: fact.entities?.places ?? [],
        projects: fact.entities?.projects ?? [],
        topics: fact.entities?.topics ?? [],
        events: fact.entities?.events ?? [],
        relationships: fact.entities?.relationships ?? [],
      };

      const totalExtracted =
        extractedData.people.length +
        extractedData.organizations.length +
        extractedData.places.length +
        extractedData.projects.length +
        extractedData.topics.length +
        extractedData.events.length;

      if (totalExtracted === 0) {
        const fallbackName = (fact.fallbackTopic || "").trim();
        if (fallbackName && fallbackName.length <= 60) {
          extractedData.topics.push({ name: fallbackName });
        }
      }

      const memoryDate = fact.date ? new Date(fact.date) : undefined;

      const memory = await prisma.memory.create({
        data: {
          userId: user.id,
          content: fact.text,
          rawInput: fact.text,
          summary: makeMemoryTitle(fact.text),
          contentType: contentType as ContentType,
          fileUrl,
          sourceUrl,
          tags: extractedData.topics.map((t) => t.name),
          createdAt: memoryDate,
        },
      });

      if (embedding.length > 0) {
        await prisma.$executeRaw`
          UPDATE "Memory"
          SET "embedding" = ${JSON.stringify(embedding)}::vector
          WHERE "id" = ${memory.id}
        `;
      }

      // 4. Process entities and create relationships
      const entityMap: Record<string, string> = {}; // name -> id mapping

      // Add people
      for (const person of extractedData.people) {
        const entity = await prisma.entity.upsert({
          where: {
            userId_name_type: {
              userId: user.id,
              name: person.name,
              type: "PERSON",
            },
          },
          update: {
            summary: person.context ? makeMemoryTitle(person.context) : undefined,
            attributes: {
              relationship: person.relationship,
            },
          },
          create: {
            userId: user.id,
            name: person.name,
            type: "PERSON",
            summary: person.context ? makeMemoryTitle(person.context) : undefined,
            attributes: {
              relationship: person.relationship,
            },
          },
        });
        entityMap[person.name] = entity.id;

        // Create memory-entity link
        await prisma.memoryEntity.create({
          data: {
            memoryId: memory.id,
            entityId: entity.id,
          },
        });
      }

      // Add organizations
      for (const org of extractedData.organizations) {
        const entity = await prisma.entity.upsert({
          where: {
            userId_name_type: {
              userId: user.id,
              name: org.name,
              type: "ORGANIZATION",
            },
          },
          update: {},
          create: {
            userId: user.id,
            name: org.name,
            type: "ORGANIZATION",
            attributes: { type: org.type },
          },
        });
        entityMap[org.name] = entity.id;

        await prisma.memoryEntity.create({
          data: {
            memoryId: memory.id,
            entityId: entity.id,
          },
        });
      }

      // Add places
      for (const place of extractedData.places) {
        const entity = await prisma.entity.upsert({
          where: {
            userId_name_type: {
              userId: user.id,
              name: place.name,
              type: "PLACE",
            },
          },
          update: {},
          create: {
            userId: user.id,
            name: place.name,
            type: "PLACE",
            attributes: { placeType: place.type },
          },
        });
        entityMap[place.name] = entity.id;

        await prisma.memoryEntity.create({
          data: {
            memoryId: memory.id,
            entityId: entity.id,
          },
        });
      }

      // Add projects
      for (const project of extractedData.projects) {
        const entity = await prisma.entity.upsert({
          where: {
            userId_name_type: {
              userId: user.id,
              name: project.name,
              type: "PROJECT",
            },
          },
          update: {},
          create: {
            userId: user.id,
            name: project.name,
            type: "PROJECT",
            attributes: { status: project.status },
          },
        });
        entityMap[project.name] = entity.id;

        await prisma.memoryEntity.create({
          data: {
            memoryId: memory.id,
            entityId: entity.id,
          },
        });
      }

      // Add topics
      for (const topic of extractedData.topics) {
        const entity = await prisma.entity.upsert({
          where: {
            userId_name_type: {
              userId: user.id,
              name: topic.name,
              type: "TOPIC",
            },
          },
          update: {},
          create: {
            userId: user.id,
            name: topic.name,
            type: "TOPIC",
          },
        });
        entityMap[topic.name] = entity.id;

        await prisma.memoryEntity.create({
          data: {
            memoryId: memory.id,
            entityId: entity.id,
          },
        });
      }

      // Add events
      for (const event of extractedData.events) {
        const entity = await prisma.entity.upsert({
          where: {
            userId_name_type: {
              userId: user.id,
              name: event.name,
              type: "EVENT",
            },
          },
          update: {},
          create: {
            userId: user.id,
            name: event.name,
            type: "EVENT",
            attributes: { date: event.date },
          },
        });
        entityMap[event.name] = entity.id;

        await prisma.memoryEntity.create({
          data: {
            memoryId: memory.id,
            entityId: entity.id,
          },
        });
      }

      // 5. Create relationships
      for (const rel of extractedData.relationships) {
        const fromId = entityMap[rel.from];
        const toId = entityMap[rel.to];

        if (fromId && toId) {
          await prisma.entityRelation.upsert({
            where: {
              fromEntityId_toEntityId_label: {
                fromEntityId: fromId,
                toEntityId: toId,
                label: rel.label,
              },
            },
            update: { strength: 1.0 },
            create: {
              fromEntityId: fromId,
              toEntityId: toId,
              label: rel.label,
              strength: 1.0,
            },
          });
        }
      }

      const entitiesFound = await prisma.memoryEntity.findMany({
        where: { memoryId: memory.id },
        include: { entity: true },
      });

      created.push({
        memoryId: memory.id,
        entitiesFound: entitiesFound.map((me: (typeof entitiesFound)[number]) => me.entity),
      });
    }));

    if (created.length === 0) {
      const reason = isQuestionLike(content) ? "question-like" : "no-durable-facts";
      return NextResponse.json({ skipped: true, reason });
    }

    return NextResponse.json({
      memories: created,
      success: true,
    });
  } catch (error) {
    console.error("Memory ingestion failed:", error);
    return apiError("Memory ingestion failed", 500, String(error));
  }
}
