"use client";

import { SessionProvider } from "next-auth/react";
import React from "react";

export function RootSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
