import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/db/prisma";

// PATCH /api/agents/suggestions/:id — dismiss a suggestion
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Verify ownership before updating
  const suggestion = await prisma.agentSuggestion.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!suggestion) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.agentSuggestion.update({
    where: { id: params.id },
    data: { dismissed: true },
  });

  return NextResponse.json({ suggestion: updated });
}