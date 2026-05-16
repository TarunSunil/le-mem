import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const entities = await prisma.entity.findMany({ where: { userId: user.id } });

    // Group entities by type for simple context pages
    const groups: Array<{ id: string; title: string; contexts: any[] }> = [];

    if (entities.length > 0) {
      const byType: Record<string, any[]> = {};
      for (const e of entities) {
        if (!byType[e.type]) byType[e.type] = [];
        byType[e.type].push({
          id: e.id,
          label: e.type,
          title: e.name,
          summary: e.summary || "",
          accent: "#e07a5f",
        });
      }

      for (const [type, items] of Object.entries(byType)) {
        groups.push({ id: type, title: type, contexts: items });
      }

      return NextResponse.json({ groups });
    }

    // Fallback: if no entities exist, build context groups from memories (use tags/summaries)
    const memories = await prisma.memory.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    if (memories.length === 0) {
      return NextResponse.json({ groups: [] });
    }

    // Group by tag (first tag) or create a default "Memories" group
    const tagGroups: Record<string, any[]> = {};
    for (const m of memories) {
      const tag = (m.tags && m.tags[0]) || "Memories";
      if (!tagGroups[tag]) tagGroups[tag] = [];
      tagGroups[tag].push({
        id: `mem-${m.id}`,
        label: tag,
        title: m.summary ? (m.summary.slice(0, 60)) : (m.content.slice(0, 60)),
        summary: m.summary || m.content.slice(0, 200),
        accent: "#2a9d8f",
      });
    }

    for (const [tag, items] of Object.entries(tagGroups)) {
      groups.push({ id: `tag-${tag}`, title: tag, contexts: items });
    }

    return NextResponse.json({ groups });
  } catch (error) {
    console.error("Contexts API error:", error);
    return NextResponse.json({ error: "Failed to fetch contexts" }, { status: 500 });
  }
}
