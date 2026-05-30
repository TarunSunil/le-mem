"use client";

import { useEffect } from "react";

type RecentContext = {
  id: string;
  label: string;
};

export function RecentContextTracker({ id, label }: RecentContext) {
  useEffect(() => {
    try {
      const stored = localStorage.getItem("le-mem:recent-contexts");
      const parsed = stored ? (JSON.parse(stored) as RecentContext[]) : [];
      const next = Array.isArray(parsed) ? parsed : [];
      const filtered = next.filter((item) => item.id !== id);
      filtered.unshift({ id, label });
      localStorage.setItem("le-mem:recent-contexts", JSON.stringify(filtered.slice(0, 8)));
    } catch {
      // Ignore storage errors.
    }
  }, [id, label]);

  return null;
}
