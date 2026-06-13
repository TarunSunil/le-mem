"use client";

import { useEffect, useState } from "react";

type Suggestion = {
  id: string;
  type: "contradiction" | "consolidation" | "reminder";
  title: string;
  body: string;
  memoryIds: string[];
  createdAt: string;
};

const TYPE_META: Record<
  Suggestion["type"],
  { icon: string; label: string; color: string }
> = {
  contradiction: {
    icon: "warning",
    label: "Conflict",
    color: "var(--fyi-warning, #f59e0b)",
  },
  consolidation: {
    icon: "merge",
    label: "Can merge",
    color: "var(--fyi-highlight, #a78bfa)",
  },
  reminder: {
    icon: "history",
    label: "Revisit",
    color: "var(--fyi-accent, #60a5fa)",
  },
};

export function AgentSuggestions() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  async function fetchSuggestions() {
    try {
      const res = await fetch("/api/agents/suggestions");
      if (!res.ok) return;
      const data = await res.json();
      setSuggestions(data.suggestions ?? []);
    } catch {
      // silently fail — non-critical UI
    } finally {
      setLoading(false);
    }
  }

  async function dismiss(id: string) {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
    try {
      await fetch(`/api/agents/suggestions/${id}`, { method: "PATCH" });
    } catch {
      // optimistic update — re-fetch on next load
    }
  }

  function reviewMemories(memoryIds: string[]) {
    const params = new URLSearchParams({ ids: memoryIds.join(",") });
    window.location.href = `/timeline?${params.toString()}`;
  }

  if (loading || suggestions.length === 0) return null;

  return (
    <div className="mb-4 space-y-2">
      {suggestions.map((s) => {
        const meta = TYPE_META[s.type];
        return (
          <div
            key={s.id}
            className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-sm px-4 py-3"
            style={{ borderLeft: `3px solid ${meta.color}` }}
          >
            <div className="flex items-start justify-between gap-3">
              {/* Left: icon + content */}
              <div className="flex items-start gap-2 min-w-0">
                <span
                  className="material-symbols-outlined text-base mt-0.5 shrink-0"
                  style={{ color: meta.color }}
                >
                  {meta.icon}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-[10px] uppercase tracking-[0.2em] font-medium"
                      style={{ color: meta.color }}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <p
                    className="text-[13px] font-medium leading-snug"
                    style={{ color: "var(--fyi-text, #f1f5f9)" }}
                  >
                    {s.title}
                  </p>
                  <p
                    className="text-[12px] mt-1 leading-relaxed line-clamp-2"
                    style={{ color: "var(--fyi-muted, #94a3b8)" }}
                  >
                    {s.body}
                  </p>
                </div>
              </div>

              {/* Right: actions */}
              <div className="flex items-center gap-1 shrink-0">
                {s.memoryIds.length > 0 && (
                  <button
                    onClick={() => reviewMemories(s.memoryIds)}
                    className="rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.15em] border border-white/10 hover:bg-white/10 transition-colors"
                    style={{ color: "var(--fyi-muted, #94a3b8)" }}
                    title="Review source memories"
                  >
                    Review
                  </button>
                )}
                <button
                  onClick={() => dismiss(s.id)}
                  className="rounded-full p-1 hover:bg-white/10 transition-colors"
                  style={{ color: "var(--fyi-muted, #94a3b8)" }}
                  title="Dismiss"
                  aria-label="Dismiss suggestion"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}