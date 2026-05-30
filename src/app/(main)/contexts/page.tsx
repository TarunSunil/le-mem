// Server-rendered contexts page: fetches groups for the signed-in user using Prisma.
import Link from "next/link";
import { type Session } from "next-auth";
import { unstable_cache } from "next/cache";
import { getCachedSession } from "@/lib/auth/get-session";
import { prisma } from "../../../lib/db/prisma";
import { isQuestionLike, humanizeEntityType, makeMemoryTitle } from "@/lib/memoryHelpers";

export const revalidate = 60;

type ContextCard = {
  id: string;
  label: string;
  title: string;
  summary: string;
  accent: string;
  categories?: string[];
};

type ContextGroup = {
  id: string;
  title: string;
  description?: string;
  contexts: ContextCard[];
};

async function loadGroupsCached(userId: string): Promise<ContextGroup[]> {
  return unstable_cache(
    async () => {
      const entities = await prisma.entity.findMany({ where: { userId } });
      const groups: ContextGroup[] = [];

      if (entities.length > 0) {
        const byType: Record<string, ContextCard[]> = {};
        const filteredEntities = entities.filter(
          (e) => !(e.type === "TOPIC" && e.name.length > 60)
        );
        for (const e of filteredEntities) {
          if (!byType[e.type]) byType[e.type] = [];
          const summaryText = e.summary ? makeMemoryTitle(e.summary) : "";
          byType[e.type].push({
            id: e.id,
            label: humanizeEntityType(e.type),
            title: summaryText || e.name,
            summary: summaryText,
            accent: "#e07a5f",
          });
        }

        for (const [type, items] of Object.entries(byType)) {
          groups.push({ id: type, title: humanizeEntityType(type), contexts: items });
        }

        return groups;
      }

      const memories = await prisma.memory.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      if (memories.length === 0) return [];

      // Filter out question-like rows (we don't surface questions as contexts)
      const realMemories = memories.filter((m) => !isQuestionLike(m.rawInput || m.content));

      const tagGroups: Record<string, ContextCard[]> = {};
      for (const m of realMemories) {
        const tag = (m.tags && m.tags[0]) || "Memories";
        if (!tagGroups[tag]) tagGroups[tag] = [];
        tagGroups[tag].push({
          id: `mem-${m.id}`,
          label: tag,
          title: makeMemoryTitle(m.summary || m.content, 12, 60),
          summary: m.summary ? makeMemoryTitle(m.summary, 24, 200) : m.content.slice(0, 200),
          accent: "#2a9d8f",
        });
      }

      for (const [tag, items] of Object.entries(tagGroups)) {
        groups.push({ id: `tag-${tag}`, title: tag, contexts: items });
      }

      return groups;
    },
    [`context-groups-${userId}`],
    { revalidate: 30, tags: [`user-contexts-${userId}`] }
  )();
}

async function loadGroups(): Promise<ContextGroup[]> {
  const session = (await getCachedSession()) as Session | null;
  if (!session?.user?.email) return [];

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return [];

  return loadGroupsCached(user.id);
}

export default async function ContextsPage() {
  const groups = await loadGroups();
  const contextCount = groups.reduce((total, group) => total + group.contexts.length, 0);
  const categoryCount = groups.length;
  const stats = [
    [contextCount.toString(), "contexts active"],
    ["0", "linked memories"],
    [categoryCount.toString(), "categories"],
  ];

  return (
    <div className="flex min-h-full flex-col px-4 py-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:px-container-padding md:py-6">
      <div className="mx-auto w-full max-w-6xl">
        <section className="glass-panel border border-white/10 p-4 md:p-6">
          <div className="mt-3 max-w-2xl">
            <h1 className="font-newsreader text-2xl leading-tight md:text-5xl" style={{ color: "var(--fyi-text)" }}>
              Everything you know, organized around your profile, projects, and working domains.
            </h1>
          </div>
        </section>

        <div className="mt-4 grid gap-3 md:mt-6 md:grid-cols-3">
          {stats.map(([value, label]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-3 md:p-4">
              <div className="text-xl font-semibold md:text-2xl" style={{ color: "var(--fyi-text)" }}>
                {value}
              </div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.18em] md:text-label-sm" style={{ color: "var(--fyi-muted)" }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {groups.length === 0 && (
          <div className="mt-8 rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-center md:mt-10 md:p-10">
            <div className="mx-auto mb-5 h-20 w-20 animate-[pulse_4s_ease-in-out_infinite] rounded-full bg-gradient-to-br from-[#e07a5f] via-[#2a9d8f] to-transparent opacity-70 blur-[2px] shadow-[0_0_40px_rgba(224,122,95,0.35)]" />
            <h2 className="text-xl font-newsreader md:text-headline-md" style={{ color: "var(--fyi-text)" }}>
              Your memory is a blank canvas.
            </h2>
            <p className="mt-2 text-xs leading-5 md:mt-3 md:text-body-md" style={{ color: "var(--fyi-muted)" }}>
              Start a conversation in chat and FYI will begin composing a calm, structured context space around you.
            </p>
            <div className="mx-auto mt-5 flex flex-wrap justify-center gap-2">
              {[
                "I'm a software engineer at [company]",
                "My hobbies include...",
                "I'm working on a project called...",
              ].map((prompt) => (
                <Link
                  key={prompt}
                  href={`/chat?prefill=${encodeURIComponent(prompt)}`}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs transition-colors hover:border-white/20 hover:bg-white/10 md:text-sm"
                  style={{ color: "var(--fyi-accent-soft)" }}
                >
                  {prompt}
                </Link>
              ))}
            </div>
            <Link
              href="/chat"
              className="mx-auto mt-5 inline-flex items-center justify-center rounded-full border border-white/10 bg-white/10 px-5 py-2 text-xs uppercase tracking-[0.2em] transition hover:bg-white/15 md:text-label-sm"
              style={{ color: "var(--fyi-text)" }}
            >
              Start your first memory
            </Link>
          </div>
        )}

        {groups.length > 0 && groups.map((group) => (
          <div key={group.id} className="mt-8 md:mt-10">
            <div className="mb-4 md:mb-6">
              <h2 className="font-newsreader text-xl md:text-3xl" style={{ color: "var(--fyi-text)" }}>
                {group.title}
              </h2>
            </div>

            {group.contexts.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
                {group.contexts.map((context) => (
                  <Link
                    key={context.id}
                    href={`/contexts/${context.id}`}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 transition-all hover:border-white/20 hover:bg-white/10 md:p-6"
                  >
                    <div className="relative z-10">
                      <div className="flex items-start justify-between">
                        <div>
                          <span
                            className="mb-2 inline-block rounded-full px-2 py-1 text-[11px] uppercase tracking-[0.16em] md:text-label-sm"
                            style={{
                              backgroundColor: `${context.accent}20`,
                              color: context.accent,
                            }}
                          >
                            {context.label}
                          </span>
                          <h3 className="mt-2 font-newsreader text-lg leading-tight md:mt-3 md:text-xl" style={{ color: "var(--fyi-text)" }}>
                            {context.title}
                          </h3>
                        </div>
                      </div>
                      <p className="mt-2 text-xs leading-5 md:mt-3 md:text-body-sm" style={{ color: "var(--fyi-muted)" }}>
                        {context.summary}
                      </p>
                    </div>
                    <div
                      className="absolute inset-0 -z-10 opacity-0 transition-opacity group-hover:opacity-20"
                      style={{ backgroundColor: context.accent }}
                    />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center">
                <p style={{ color: "var(--fyi-muted)" }}>No items in this category yet</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
