// src/app/api/memory/ingest/route.ts
import { getCachedSession } from "@/lib/auth/get-session";
import { prisma } from "@/lib/db/prisma";
import { embedMultiple } from "@/lib/ai/embed";
import { ingestPipeline } from "@/lib/ai/ingest-pipeline";
import { isQuestionLike, makeMemoryTitle } from "@/lib/memoryHelpers";
import { ContentType } from "@/types";
import { apiError } from "@/lib/api-error";
import { checkRateLimit } from "@/lib/rateLimit";
import { normalizeEntityName } from "@/lib/entity-normalization";
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

    if (!(await checkRateLimit(`ingest:${session.user.email}`))) {
      return apiError("Too many requests. Please wait a moment.", 429);
    }

    const allowedContentTypes: ContentType[] = ["TEXT", "IMAGE", "AUDIO", "PDF", "LINK", "CONTEXT_UPDATE"];
    if (!allowedContentTypes.includes(contentType as ContentType)) {
      return apiError("Invalid contentType", 400);
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
      const entityMap: Record<string, string> = {}; // normalized name -> id mapping
      const seenEntityKeys = new Set<string>();

      const rememberEntity = (name: string, id: string) => {
        entityMap[normalizeEntityName(name)] = id;
      };

      const shouldProcess = (name: string) => {
        const key = normalizeEntityName(name);
        if (!key || seenEntityKeys.has(key)) return false;
        seenEntityKeys.add(key);
        return true;
      };

      const upsertEntity = async (
        lookup: { name: string; type: "PERSON" | "ORGANIZATION" | "PLACE" | "PROJECT" | "TOPIC" | "EVENT" },
        data: Record<string, unknown>
      ) => {
        const normalizedName = normalizeEntityName(lookup.name);
        return prisma.entity.upsert({
          where: {
            userId_normalizedName_type: {
              userId: user.id,
              normalizedName,
              type: lookup.type,
            },
          },
          update: {
            ...data,
            normalizedName,
          },
          create: {
            userId: user.id,
            name: lookup.name.trim().replace(/\s+/g, " "),
            normalizedName,
            type: lookup.type,
            ...data,
          },
        });
      };

      // Add people
      for (const person of extractedData.people) {
        if (!shouldProcess(person.name)) continue;
        const entity = await prisma.entity.upsert({
          where: {
            userId_normalizedName_type: {
              userId: user.id,
              normalizedName: normalizeEntityName(person.name),
              type: "PERSON",
            },
          },
          update: {
            summary: person.context ? makeMemoryTitle(person.context) : undefined,
            attributes: {
              relationship: person.relationship,
            },
            normalizedName: normalizeEntityName(person.name),
          },
          create: {
            userId: user.id,
            name: person.name.trim().replace(/\s+/g, " "),
            normalizedName: normalizeEntityName(person.name),
            type: "PERSON",
            summary: person.context ? makeMemoryTitle(person.context) : undefined,
            attributes: {
              relationship: person.relationship,
            },
          },
        });
        rememberEntity(person.name, entity.id);

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
        if (!shouldProcess(org.name)) continue;
        const entity = await upsertEntity({ name: org.name, type: "ORGANIZATION" }, { attributes: { type: org.type } });
        rememberEntity(org.name, entity.id);

        await prisma.memoryEntity.create({
          data: {
            memoryId: memory.id,
            entityId: entity.id,
          },
        });
      }

      // Add places
      for (const place of extractedData.places) {
        if (!shouldProcess(place.name)) continue;
        const entity = await upsertEntity({ name: place.name, type: "PLACE" }, { attributes: { placeType: place.type } });
        rememberEntity(place.name, entity.id);

        await prisma.memoryEntity.create({
          data: {
            memoryId: memory.id,
            entityId: entity.id,
          },
        });
      }

      // Add projects
      for (const project of extractedData.projects) {
        if (!shouldProcess(project.name)) continue;
        const entity = await upsertEntity({ name: project.name, type: "PROJECT" }, { attributes: { status: project.status } });
        rememberEntity(project.name, entity.id);

        await prisma.memoryEntity.create({
          data: {
            memoryId: memory.id,
            entityId: entity.id,
          },
        });
      }

      // Add topics
      for (const topic of extractedData.topics) {
        if (!shouldProcess(topic.name)) continue;
        const entity = await upsertEntity({ name: topic.name, type: "TOPIC" }, {});
        rememberEntity(topic.name, entity.id);

        await prisma.memoryEntity.create({
          data: {
            memoryId: memory.id,
            entityId: entity.id,
          },
        });
      }

      // Add events
      for (const event of extractedData.events) {
        if (!shouldProcess(event.name)) continue;
        const entity = await upsertEntity({ name: event.name, type: "EVENT" }, { attributes: { date: event.date } });
        rememberEntity(event.name, entity.id);

        await prisma.memoryEntity.create({
          data: {
            memoryId: memory.id,
            entityId: entity.id,
          },
        });
      }

      // 5. Create relationships
      for (const rel of extractedData.relationships) {
        const fromId = entityMap[normalizeEntityName(rel.from)];
        const toId = entityMap[normalizeEntityName(rel.to)];

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
