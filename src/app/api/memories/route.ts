import { getCachedSession } from "@/lib/auth/get-session";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiError } from "@/lib/api-error";

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getCachedSession();
    if (!session?.user?.email) {
      return apiError("Unauthorized", 401);
    }

    // Get query parameters for pagination and filtering
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const cursor = searchParams.get("cursor");
    const sortByParam = searchParams.get("sortBy") || "createdAt";
    const pinnedOnly = searchParams.get("pinnedOnly") === "true";
    const excludePinned = searchParams.get("excludePinned") === "true";

    const allowedSortFields = new Set(["createdAt", "updatedAt"]);
    const sortBy = allowedSortFields.has(sortByParam) ? sortByParam : "createdAt";

    const where = {
      user: { email: session.user.email },
      ...(pinnedOnly ? { pinned: true } : {}),
      ...(excludePinned ? { pinned: false } : {}),
    };

    const orderBy: import("@prisma/client").Prisma.MemoryOrderByWithRelationInput[] = pinnedOnly || excludePinned
    ? [{ createdAt: "desc" as const }]
    : [{ pinned: "desc" as const }, { [sortBy]: "desc" as const }];

    // Fetch memories for the user, sorted by creation date (newest first)
    const memories = await prisma.memory.findMany({
      where,
      orderBy,
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    // Get total count for pagination
    const total = await prisma.memory.count({
      where: { user: { email: session.user.email } },
    });
    const filteredTotal = pinnedOnly || excludePinned
      ? await prisma.memory.count({ where })
      : total;

    const nextCursor = memories.length === limit ? memories[memories.length - 1]?.id : null;

    return NextResponse.json({
      memories,
      pagination: {
        total,
        filteredTotal,
        limit,
        nextCursor,
        hasMore: Boolean(nextCursor),
      },
    });
  } catch (error) {
    console.error("Fetch memories error:", error);
    return apiError("Failed to fetch memories", 500, String(error));
  }
}
