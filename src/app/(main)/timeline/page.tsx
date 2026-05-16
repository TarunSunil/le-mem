"use client";

import { useEffect, useState } from "react";

interface Memory {
  id: string;
  content: string;
  createdAt: string;
  type?: string;
  title?: string;
  entities?: Array<{ entity: { name: string; type: string } }>;
}

interface GroupedMemories {
  [key: string]: Memory[];
}

function TimelineItem({
  type = "note_add",
  title,
  summary,
}: {
  type?: string;
  title: string;
  summary: string;
}) {
  const getIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      travel: "flight_takeoff",
      person: "person",
      project: "workspaces",
      "context update": "update",
      memory: "note_add",
    };
    return iconMap[type] || "note_add";
  };

  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-5 transition-colors hover:border-secondary-container/30 hover:bg-white/8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-container/15 text-secondary">
          <span className="material-symbols-outlined text-xl">
            {getIcon(type)}
          </span>
        </div>
        <div>
          <p
            className="text-label-sm uppercase tracking-[0.2em]"
            style={{ color: "var(--fyi-accent)" }}
          >
            {type}
          </p>
          <h2 className="mt-1 text-body-md font-medium" style={{ color: "#e5e2e1" }}>
            {title}
          </h2>
        </div>
      </div>

      <p className="mt-4 text-body-md leading-7" style={{ color: "var(--fyi-muted)" }}>
        {summary}
      </p>
    </article>
  );
}

export default function TimelinePage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [groupedMemories, setGroupedMemories] = useState<GroupedMemories>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMemories = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/memories?limit=100");
        
        if (!response.ok) {
          throw new Error("Failed to fetch memories");
        }

        const data = await response.json();
        setMemories(data.memories || []);

        // Group memories by date
        const grouped = groupMemoriesByDate(data.memories || []);
        setGroupedMemories(grouped);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Fetch memories error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMemories();
  }, []);

  const groupMemoriesByDate = (memories: Memory[]) => {
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
      } else if (
        today.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000
      ) {
        dateKey = "This Week";
      }

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(memory);
    });

    return groups;
  };

  const dateOrder = ["Today", "Yesterday", "This Week", "Earlier"];

  return (
    <div className="flex h-full flex-col px-container-padding py-6">
      <div className="mx-auto w-full max-w-5xl">
        <section className="glass-panel border border-white/10 p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-secondary-container px-3 py-1 text-label-sm text-on-secondary-container">
              Memory Timeline
            </span>
            <span className="rounded-full border border-white/10 px-3 py-1 text-label-sm text-on-surface-variant">
              Chronological feed
            </span>
          </div>

          <div className="mt-5 max-w-2xl">
            <h1
              className="font-newsreader text-3xl leading-tight md:text-5xl"
              style={{ color: "var(--fyi-text)" }}
            >
              Every memory, ordered by time and context.
            </h1>
            <p
              className="mt-4 text-body-md md:text-body-lg"
              style={{ color: "var(--fyi-muted)" }}
            >
              The timeline turns scattered notes into a story. You can scan what
              happened today, revisit what mattered yesterday, and trace how a
              topic evolved across the week.
            </p>
          </div>
        </section>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            [memories.length.toString(), "memories total"],
            ["0", "people connected"],
            ["0", "context pages updated"],
          ].map(([value, label]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-2xl font-semibold" style={{ color: "#e5e2e1" }}>
                {value}
              </div>
              <div className="mt-1 text-label-sm" style={{ color: "var(--fyi-muted)" }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {isLoading && (
          <div className="mt-8 text-center" style={{ color: "var(--fyi-muted)" }}>
            Loading memories...
          </div>
        )}

        {error && (
          <div
            className="mt-8 rounded-lg border border-red-500 bg-red-500/10 p-4"
            style={{ color: "#ff6b6b" }}
          >
            Error: {error}
          </div>
        )}

        {!isLoading && !error && Object.keys(groupedMemories).length === 0 && (
          <div className="mt-8 text-center" style={{ color: "var(--fyi-muted)" }}>
            No memories yet. Start by adding a memory in the chat!
          </div>
        )}

        {!isLoading && !error && (
          <div className="mt-8 space-y-8">
            {dateOrder.map((dateKey) => {
              const items = groupedMemories[dateKey];
              if (!items || items.length === 0) return null;

              return (
                <section key={dateKey}>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="h-px flex-1 bg-white/10" />
                    <h2
                      className="text-label-sm uppercase tracking-[0.24em]"
                      style={{ color: "var(--fyi-accent)" }}
                    >
                      {dateKey}
                    </h2>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>

                  <div className="grid gap-4">
                    {items.map((item, index) => (
                      <TimelineItem
                        key={`${item.id}-${index}`}
                        type={item.type || "memory"}
                        title={item.title || item.content.substring(0, 50)}
                        summary={item.content}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
