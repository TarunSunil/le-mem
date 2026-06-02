import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (request.method !== "GET" && pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin");
    const allowedOrigins = [
      process.env.NEXTAUTH_URL,
      "https://le-mem-inky.vercel.app",
      "http://localhost:3000",
    ].filter(Boolean).map((url) => {
      try { return new URL(url!).origin; } catch { return url!; }
    });

    if (origin && !allowedOrigins.some((allowed) => origin.startsWith(allowed))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
