import { getCachedSession } from "@/lib/auth/get-session";
import { prisma } from "../../../lib/db/prisma";
import { isQuestionLike } from "@/lib/memoryHelpers";
import { type Session } from "next-auth";

interface Memory {
  id: string;
  content: string;
  rawInput?: string;
  summary?: string | null;
  tags?: string[] | null;
  createdAt: Date;
  type?: string;
  title?: string;
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
  const getIcon = (value: string) => {
    const iconMap: Record<string, string> = {
      travel: "flight_takeoff",
      person: "person",
      project: "workspaces",
      "context update": "update",
      memory: "note_add",
    };
    return iconMap[value] || "note_add";
  };

  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-4 transition-colors hover:border-secondary-container/30 hover:bg-white/8 md:p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-container/15 text-secondary md:h-10 md:w-10">
          <span className="material-symbols-outlined text-lg md:text-xl">{getIcon(type)}</span>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] md:text-label-sm" style={{ color: "var(--fyi-accent)" }}>
            {type}
          </p>
          <h2 className="mt-1 text-sm font-medium md:text-body-md" style={{ color: "#e5e2e1" }}>
            {title}
          </h2>
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 md:mt-4 md:text-body-md md:leading-7" style={{ color: "var(--fyi-muted)" }}>
        {summary}
      </p>
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

export async function TimelineContent() {
  const session = (await getCachedSession()) as Session | null;

  if (!session?.user?.email) {
    return null;
  }

  const memories = await prisma.memory.findMany({
    where: {
      user: {
        email: session.user.email,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });

  // Filter out question-like inputs (they shouldn't appear in the timeline)
  const filtered = memories.filter((m) => !isQuestionLike(m.rawInput || m.content));

  const enriched = filtered.map((m) => ({
    ...m,
    title: m.summary || (m.tags && m.tags[0]) || m.content.substring(0, 50),
  }));

  const groupedMemories = groupMemoriesByDate(enriched as Memory[]);
  const dateOrder = ["Today", "Yesterday", "This Week", "Earlier"];

  return (
    <>
      <div className="mt-4 grid gap-3 md:mt-6 md:grid-cols-3">
        {[
          [memories.length.toString(), "memories total"],
          ["0", "people connected"],
          ["0", "context pages updated"],
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

      {Object.keys(groupedMemories).length === 0 ? (
        <div className="mt-6 text-center text-xs leading-5 md:mt-8 md:text-body-md" style={{ color: "var(--fyi-muted)" }}>
          No memories yet. Start by adding a memory in the chat!
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
    </>
  );
}