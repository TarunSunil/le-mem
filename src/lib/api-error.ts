import { NextResponse } from "next/server";

export function apiError(message: string, status: number, details?: string) {
  const isDev = process.env.NODE_ENV === "development";
  return NextResponse.json(
    {
      error: message,
      ...(isDev && details ? { details } : {}),
    },
    { status }
  );
}
