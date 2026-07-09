import { getCachedSession } from "@/lib/auth/get-session";
import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";

export async function DELETE(request: NextRequest) {
  const session = await getCachedSession();
  if (!session?.user?.email) {
    return apiError("Unauthorized", 401);
  }

  const body = (await request.json().catch(() => null)) as { email?: string } | null;
  const typedEmail = body?.email?.trim();
  if (!typedEmail || typedEmail !== session.user.email) {
    return apiError("Email confirmation does not match", 400);
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) {
    return apiError("User not found", 404);
  }

  await prisma.user.delete({ where: { id: user.id } });
  return NextResponse.json({ success: true });
}