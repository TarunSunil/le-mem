import { getCachedSession } from "@/lib/auth/get-session";
import { prisma } from "@/lib/db/prisma";
import { makeMemoryTitle } from "@/lib/memoryHelpers";
import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";

async function getOwnedMemory(id: string, email: string) {
  const memory = await prisma.memory.findUnique({ where: { id } });
  if (!memory) return null;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || memory.userId !== user.id) return null;

  return memory;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getCachedSession();
  if (!session?.user?.email) {
    return apiError("Unauthorized", 401);
  }

  const { id } = await context.params;
  const existing = await getOwnedMemory(id, session.user.email);
  if (!existing) {
    return apiError("Memory not found", 404);
  }

  const body = (await request.json()) as {
    content?: string;
    summary?: string | null;
    tags?: string[];
    pinned?: boolean;
  };
  const content = body.content?.trim();

  const updated = await prisma.memory.update({
    where: { id },
    data: {
      ...(content
        ? {
            content,
            rawInput: content,
            summary: body.summary ?? makeMemoryTitle(content),
          }
        : {}),
      ...(Array.isArray(body.tags) ? { tags: body.tags } : {}),
      ...(typeof body.pinned === "boolean" ? { pinned: body.pinned } : {}),
    },
  });

  return NextResponse.json({ memory: updated, success: true });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getCachedSession();
  if (!session?.user?.email) {
    return apiError("Unauthorized", 401);
  }

  const { id } = await context.params;
  const existing = await getOwnedMemory(id, session.user.email);
  if (!existing) {
    return apiError("Memory not found", 404);
  }

  await prisma.memory.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
