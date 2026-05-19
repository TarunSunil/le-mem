// src/app/api/memory/ingest/route.ts
import { getCachedSession } from "@/lib/auth/get-session";
import { prisma } from "@/lib/db/prisma";
import { embedText } from "@/lib/ai/embed";
import { extractEntities } from "@/lib/ai/extract-entities";
import { splitFacts } from "@/lib/ai/split-facts";
import { isQuestionLike, makeMemoryTitle } from "@/lib/memoryHelpers";
import { ContentType } from "@/types";
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    if (!content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const atomicFacts = await splitFacts(content);
    const dedupedFacts = Array.from(new Set(atomicFacts.map((fact) => fact.trim()))).filter(Boolean);

    if (dedupedFacts.length === 0) {
      const reason = isQuestionLike(content) ? "question-like" : "no-durable-facts";
      return NextResponse.json({ skipped: true, reason });
    }

    const created: Array<{ memoryId: string; entitiesFound: unknown[] }> = [];

    for (const fact of dedupedFacts) {
      if (isQuestionLike(fact)) {
        continue;
      }

      // 1. Generate embedding (best-effort)
      const embedding = await embedText(fact);

      // 2. Extract entities
      const extractedData = await extractEntities(fact);

      // If extraction returned nothing (e.g., no extraction model configured),
      // create a fallback topic entity from the content so contexts/graph show up.
      const totalExtracted =
        extractedData.people.length +
        extractedData.organizations.length +
        extractedData.places.length +
        extractedData.projects.length +
        extractedData.topics.length +
        extractedData.events.length;

      if (totalExtracted === 0) {
        const fallbackName = (fact || "").trim().split("\n")[0].slice(0, 80) || "Note";
        extractedData.topics.push({ name: fallbackName });
      }

      // 3. Create memory record with a concise `summary` used for titles/previews
      const memory = await prisma.memory.create({
        data: {
          userId: user.id,
          content: fact,
          rawInput: fact,
          summary: makeMemoryTitle(fact),
          contentType: contentType as ContentType,
          fileUrl,
          sourceUrl,
          tags: extractedData.topics.map((t) => t.name),
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
            summary: person.context || undefined,
            attributes: {
              relationship: person.relationship,
            },
          },
          create: {
            userId: user.id,
            name: person.name,
            type: "PERSON",
            summary: person.context,
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
    }

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
    return NextResponse.json(
      { error: "Memory ingestion failed", details: String(error) },
      { status: 500 }
    );
  }
}
