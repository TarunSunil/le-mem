import { getCachedSession } from "@/lib/auth/get-session";
import { prisma } from "@/lib/db/prisma";
import { makeMemoryTitle } from "@/lib/memoryHelpers";
import { NextRequest, NextResponse } from "next/server";

async function getOwnedMemory(id: string, email: string) {
  return prisma.memory.findFirst({
    where: {
      id,
      user: { email },
    },
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getCachedSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = await getOwnedMemory(id, session.user.email);
  if (!existing) {
    return NextResponse.json({ error: "Memory not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    content?: string;
    summary?: string | null;
    tags?: string[];
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = await getOwnedMemory(id, session.user.email);
  if (!existing) {
    return NextResponse.json({ error: "Memory not found" }, { status: 404 });
  }

  await prisma.memory.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
