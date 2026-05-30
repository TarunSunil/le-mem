import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (request.method !== "GET" && pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin");
    const allowedBase = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const allowedOrigin = (() => {
      try {
        return new URL(allowedBase).origin;
      } catch {
        return allowedBase;
      }
    })();

    if (origin && !origin.startsWith(allowedOrigin)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
