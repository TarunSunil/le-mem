// src/app/api/memory/ingest/route.ts
import { authOptions } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { embedText } from "@/lib/ai/embed";
import { extractEntities } from "@/lib/ai/extract-entities";
import { ContentType, EntityType } from "@/types";
import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const {
      content,
      contentType = "TEXT",
      fileUrl,
      sourceUrl,
    } = await request.json();

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

    if (!content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 1. Generate embedding
    const embedding = await embedText(content);
    void embedding;

    // 2. Extract entities
    const extractedData = await extractEntities(content);

    // 3. Create memory record
    const memory = await prisma.memory.create({
      data: {
        userId: user.id,
        content,
        rawInput: content,
        contentType: contentType as ContentType,
        fileUrl,
        sourceUrl,
        tags: extractedData.topics.map((t) => t.name),
      },
    });

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

    // Return response with created memory and entities
    const entitiesFound = await prisma.memoryEntity.findMany({
      where: { memoryId: memory.id },
      include: { entity: true },
    });

    return NextResponse.json({
      memoryId: memory.id,
      entitiesFound: entitiesFound.map((me: (typeof entitiesFound)[number]) => me.entity),
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
