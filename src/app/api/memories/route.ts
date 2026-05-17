import { getCachedSession } from "@/lib/auth/get-session";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getCachedSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters for pagination and filtering
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = parseInt(searchParams.get("skip") || "0");
    const sortBy = searchParams.get("sortBy") || "createdAt";

    // Fetch memories for the user, sorted by creation date (newest first)
    const memories = await prisma.memory.findMany({
      where: {
        user: {
          email: session.user.email,
        },
      },
      include: {
        entities: {
          include: {
            entity: true,
          },
        },
      },
      orderBy: {
        [sortBy]: "desc",
      },
      take: limit,
      skip: skip,
    });

    // Get total count for pagination
    const total = await prisma.memory.count({
      where: {
        user: {
          email: session.user.email,
        },
      },
    });

    return NextResponse.json({
      memories,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total,
      },
    });
  } catch (error) {
    console.error("Fetch memories error:", error);
    return NextResponse.json(
      { error: "Failed to fetch memories" },
      { status: 500 }
    );
  }
}
