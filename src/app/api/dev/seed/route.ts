import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiError } from "@/lib/api-error";

export async function POST(req: NextRequest) {
  try {
    if (process.env.NODE_ENV !== "development") {
      return apiError("Not found", 404);
    }

    const configuredSecret = process.env.DEV_SEED_SECRET;
    const providedSecret = req.headers.get("x-dev-seed-secret");

    if (!configuredSecret || providedSecret !== configuredSecret) {
      return apiError("Forbidden", 403);
    }

    const email = process.env.DEV_SEED_EMAIL || "dev@local.test";

    // Create or get user
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, name: "Dev User" },
    });

    // Create sample entities
    const alice = await prisma.entity.upsert({
      where: { userId_name_type: { userId: user.id, name: "Alice", type: "PERSON" } },
      update: {},
      create: { userId: user.id, name: "Alice", type: "PERSON", summary: "Friend from college" },
    });

    const acme = await prisma.entity.upsert({
      where: { userId_name_type: { userId: user.id, name: "Acme Corp", type: "ORGANIZATION" } },
      update: {},
      create: { userId: user.id, name: "Acme Corp", type: "ORGANIZATION" },
    });

    const project = await prisma.entity.upsert({
      where: { userId_name_type: { userId: user.id, name: "FYI Migration", type: "PROJECT" } },
      update: {},
      create: { userId: user.id, name: "FYI Migration", type: "PROJECT" },
    });

    // Create relations
    await prisma.entityRelation.upsert({
      where: { fromEntityId_toEntityId_label: { fromEntityId: alice.id, toEntityId: acme.id, label: "works at" } },
      update: {},
      create: { fromEntityId: alice.id, toEntityId: acme.id, label: "works at", strength: 1.0 },
    });

    await prisma.entityRelation.upsert({
      where: { fromEntityId_toEntityId_label: { fromEntityId: alice.id, toEntityId: project.id, label: "contributes to" } },
      update: {},
      create: { fromEntityId: alice.id, toEntityId: project.id, label: "contributes to", strength: 1.0 },
    });

    return NextResponse.json({ success: true, user: { email: user.email }, entities: [alice.id, acme.id, project.id] });
  } catch (error) {
    console.error("Dev seed failed:", error);
    return apiError("Seed failed", 500, String(error));
  }
}
