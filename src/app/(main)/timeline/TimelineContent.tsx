"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isQuestionLike, makeMemoryTitle } from "@/lib/memoryHelpers";
import { TimelineActions } from "./TimelineActions";

const PAGE_SIZE = 20;

interface Memory {
  id: string;
  content: string;
  rawInput?: string | null;
  summary?: string | null;
  tags?: string[] | null;
  createdAt: string;
  pinned?: boolean;
  type?: string;
}

interface GroupedMemories {
  [key: string]: Memory[];
}

function TimelineItem({
  memory,
  onUpdate,
  onDelete,
}: {
  memory: Memory;
  onUpdate: (next: Partial<Memory>) => void;
  onDelete: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const getIcon = (value: string) => {
    const iconMap: Record<string, string> = {
      travel: "flight_takeoff",
      person: "person",
      project: "workspaces",
      "context update": "update",
      memory: "note_add",
      pinned: "push_pin",
    };
    return iconMap[value] || "note_add";
  };

  const typeLabel = memory.pinned ? "pinned" : memory.type || "memory";
  const title = memory.summary || (memory.tags && memory.tags[0]) || makeMemoryTitle(memory.content, 12, 80);

  return (
    <article
      ref={containerRef}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          const firstAction = containerRef.current?.querySelector("button");
          if (firstAction instanceof HTMLButtonElement) {
            firstAction.focus();
          }
        }
      }}
      className="rounded-3xl border border-white/10 bg-white/5 p-4 transition-colors hover:border-secondary-container/30 hover:bg-white/8 md:p-5"
      aria-label={`Timeline memory: ${title}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-container/15 text-secondary md:h-10 md:w-10">
          <span className="material-symbols-outlined text-lg md:text-xl">{getIcon(typeLabel)}</span>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] md:text-label-sm" style={{ color: "var(--fyi-accent)" }}>
            {typeLabel}
          </p>
          <h2 className="mt-1 text-sm font-medium md:text-body-md" style={{ color: "#e5e2e1" }}>
            {title}
          </h2>
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 md:mt-4 md:text-body-md md:leading-7" style={{ color: "var(--fyi-muted)" }}>
        {memory.content}
      </p>

      <TimelineActions
        id={memory.id}
        content={memory.content}
        pinned={memory.pinned}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    </article>
  );
}

function groupMemoriesByDate(memories: Memory[]) {
  const groups: GroupedMemories = {};

  memories.forEach((memory) => {
    const date = new Date(memory.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let dateKey = "Earlier";

    if (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    ) {
      dateKey = "Today";
    } else if (
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()
    ) {
      dateKey = "Yesterday";
    } else if (today.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
      dateKey = "This Week";
    }

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(memory);
  });

  return groups;
}

export function TimelineContent() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [pinned, setPinned] = useState<Memory[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const loadPinned = async () => {
    const response = await fetch(`/api/memories?pinnedOnly=true&limit=50`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error(`Failed to load pinned (${response.status})`);
    const data = await response.json();
    return (data.memories || []) as Memory[];
  };

  const loadPage = async (cursor?: string | null) => {
    const params = new URLSearchParams({
      limit: PAGE_SIZE.toString(),
      excludePinned: "true",
    });
    if (cursor) params.set("cursor", cursor);
    const response = await fetch(`/api/memories?${params.toString()}`, { credentials: "include" });
    if (!response.ok) throw new Error(`Failed to load memories (${response.status})`);
    const data = await response.json();
    return {
      memories: (data.memories || []) as Memory[],
      nextCursor: data.pagination?.nextCursor ?? null,
      total: data.pagination?.total ?? 0,
    };
  };

  const refreshTimeline = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [pinnedData, pageData] = await Promise.all([
        loadPinned(),
        loadPage(null),
      ]);

      const cleanPinned = pinnedData.filter((m) => !isQuestionLike(m.rawInput || m.content));
      const cleanMemories = pageData.memories.filter((m) => !isQuestionLike(m.rawInput || m.content));

      setPinned(cleanPinned);
      setMemories(cleanMemories);
      setNextCursor(pageData.nextCursor);
      setTotalCount(pageData.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load timeline");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshTimeline();
  }, [refreshTimeline]);

  const handleLoadMore = async () => {
    if (!nextCursor) return;
    setIsLoadingMore(true);
    try {
      const pageData = await loadPage(nextCursor);
      const cleanMemories = pageData.memories.filter((m) => !isQuestionLike(m.rawInput || m.content));
      setMemories((prev) => [...prev, ...cleanMemories]);
      setNextCursor(pageData.nextCursor);
      setTotalCount(pageData.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load more memories");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const all = [...pinned, ...memories];
    for (const memory of all) {
      for (const tag of memory.tags ?? []) {
        if (!tag) continue;
        counts[tag] = (counts[tag] || 0) + 1;
      }
    }
    return counts;
  }, [memories, pinned]);

  const tags = useMemo(() => {
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag]) => tag);
  }, [tagCounts]);

  const filterByTag = (items: Memory[]) => {
    if (!activeTag) return items;
    return items.filter((memory) => (memory.tags || []).includes(activeTag));
  };

  const filteredPinned = filterByTag(pinned);
  const filteredMemories = filterByTag(memories);
  const groupedMemories = groupMemoriesByDate(filteredMemories);
  const dateOrder = ["Today", "Yesterday", "This Week", "Earlier"];

  const updateMemory = (id: string, next: Partial<Memory>) => {
    if (typeof next.pinned === "boolean") {
      void refreshTimeline();
      return;
    }

    const applyUpdate = (items: Memory[]) =>
      items.map((memory) => (memory.id === id ? { ...memory, ...next } : memory));
    setPinned((prev) => applyUpdate(prev));
    setMemories((prev) => applyUpdate(prev));
  };

  const removeMemory = (id: string) => {
    setPinned((prev) => prev.filter((memory) => memory.id !== id));
    setMemories((prev) => prev.filter((memory) => memory.id !== id));
    setTotalCount((prev) => Math.max(0, prev - 1));
  };

  if (isLoading) {
    return (
      <div className="mt-8 space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-3xl border border-white/10 bg-white/5 p-5"
          />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="mt-4 grid gap-3 md:mt-6 md:grid-cols-3">
        {[
          [totalCount.toString(), "memories total"],
          [pinned.length.toString(), "pinned memories"],
          [tags.length.toString(), "active tags"],
        ].map(([value, label]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-3 md:p-4">
            <div className="text-xl font-semibold md:text-2xl" style={{ color: "#e5e2e1" }}>
              {value}
            </div>
            <div className="mt-1 text-[11px] uppercase tracking-[0.18em] md:text-label-sm" style={{ color: "var(--fyi-muted)" }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTag(null)}
          className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] transition ${
            activeTag === null ? "border-white/30 bg-white/10" : "border-white/10 bg-black/20"
          }`}
          style={{ color: "var(--fyi-muted)" }}
        >
          All
        </button>
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setActiveTag(tag)}
            className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] transition ${
              activeTag === tag ? "border-white/30 bg-white/10" : "border-white/10 bg-black/20"
            }`}
            style={{ color: "var(--fyi-muted)" }}
          >
            {tag}
          </button>
        ))}
      </div>

      {error && (
        <div
          className="mt-4 rounded-lg border border-red-500 bg-red-500/10 p-4 text-sm"
          style={{ color: "#ff6b6b" }}
        >
          Error: {error}
        </div>
      )}

      {filteredPinned.length > 0 && (
        <section className="mt-6 space-y-3">
          <div className="mb-3 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <h2 className="text-[10px] uppercase tracking-[0.24em]" style={{ color: "var(--fyi-accent)" }}>
              Pinned
            </h2>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <div className="grid gap-3 md:gap-4">
            {filteredPinned.map((memory) => (
              <TimelineItem
                key={memory.id}
                memory={memory}
                onUpdate={(next) => updateMemory(memory.id, next)}
                onDelete={() => removeMemory(memory.id)}
              />
            ))}
          </div>
        </section>
      )}

      {Object.keys(groupedMemories).length === 0 ? (
        <div className="mt-6 text-center text-xs leading-5 md:mt-8 md:text-body-md" style={{ color: "var(--fyi-muted)" }}>
          No memories yet. Start by adding a memory in the chat.
        </div>
      ) : (
        <div className="mt-6 space-y-6 md:mt-8 md:space-y-8">
          {dateOrder.map((dateKey) => {
            const items = groupedMemories[dateKey];
            if (!items || items.length === 0) return null;

            return (
              <section key={dateKey}>
                <div className="mb-3 flex items-center gap-3 md:mb-4">
                  <div className="h-px flex-1 bg-white/10" />
                  <h2 className="text-[10px] uppercase tracking-[0.24em] md:text-label-sm" style={{ color: "var(--fyi-accent)" }}>
                    {dateKey}
                  </h2>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <div className="grid gap-3 md:gap-4">
                  {items.map((memory) => (
                    <TimelineItem
                      key={memory.id}
                      memory={memory}
                      onUpdate={(next) => updateMemory(memory.id, next)}
                      onDelete={() => removeMemory(memory.id)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {nextCursor && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs uppercase tracking-[0.2em] transition hover:border-white/20 disabled:opacity-50"
            style={{ color: "var(--fyi-muted)" }}
          >
            {isLoadingMore ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </>
  );
}
