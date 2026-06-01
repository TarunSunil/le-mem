import { getCachedSession } from "@/lib/auth/get-session";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";

const WEEKS = 8;

function buildSparkline(counts: number[]) {
  const width = 160;
  const height = 40;
  const max = Math.max(...counts, 1);
  const step = width / (counts.length - 1 || 1);

  const points = counts
    .map((count, index) => {
      const x = Math.round(index * step);
      const y = Math.round(height - (count / max) * height);
      return `${x},${y}`;
    })
    .join(" ");

  return { width, height, points };
}

export default async function InsightsPage() {
  const session = await getCachedSession();
  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    redirect("/login");
  }

  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - WEEKS * 7);

  const [totalMemories, memoryByType, topEntities, recentMemories] = await Promise.all([
    prisma.memory.count({ where: { userId: user.id } }),
    prisma.memory.groupBy({
      by: ["contentType"],
      where: { userId: user.id },
      _count: { contentType: true },
    }),
    prisma.entity.findMany({
      where: { userId: user.id },
      orderBy: { memories: { _count: "desc" } },
      take: 5,
      include: { _count: { select: { memories: true } } },
    }),
    prisma.memory.findMany({
      where: { userId: user.id, createdAt: { gte: start } },
      select: { createdAt: true },
    }),
  ]);

  const weeklyCounts = new Array(WEEKS).fill(0);
  for (const memory of recentMemories) {
    const diffMs = now.getTime() - memory.createdAt.getTime();
    const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
    const index = WEEKS - 1 - diffWeeks;
    if (index >= 0 && index < WEEKS) weeklyCounts[index] += 1;
  }

  const spark = buildSparkline(weeklyCounts);

  return (
    <div className="flex min-h-full flex-col px-4 py-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:px-container-padding md:py-6">
      <div className="mx-auto w-full max-w-6xl">
        <section className="glass-panel border border-white/10 p-4 md:p-6">
          <div className="mt-3 max-w-2xl">
            <h1 className="font-newsreader text-2xl leading-tight md:text-5xl" style={{ color: "var(--fyi-text)" }}>
              Insights into how your memory graph is growing.
            </h1>
          </div>
        </section>

        <div className="mt-5 grid gap-4 md:mt-6 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-2xl font-semibold" style={{ color: "var(--fyi-text)" }}>
              {totalMemories}
            </div>
            <div className="mt-1 text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--fyi-muted)" }}>
              Memories stored
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--fyi-muted)" }}>
                Weekly cadence
              </div>
              <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: "var(--fyi-accent)" }}>
                {WEEKS} weeks
              </span>
            </div>
            <div className="mt-3">
              <svg width={spark.width} height={spark.height} aria-hidden="true">
                <polyline
                  fill="none"
                  stroke="var(--fyi-accent)"
                  strokeWidth="2"
                  points={spark.points}
                />
              </svg>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--fyi-muted)" }}>
              Content types
            </div>
            <div className="mt-3 space-y-2">
              {memoryByType.map((row) => (
                <div key={row.contentType} className="flex items-center justify-between text-sm">
                  <span style={{ color: "var(--fyi-text)" }}>{row.contentType}</span>
                  <span style={{ color: "var(--fyi-muted)" }}>{row._count.contentType}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:mt-8 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: "var(--fyi-accent)" }}>
              Top entities
            </p>
            <div className="mt-4 space-y-3">
              {topEntities.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--fyi-muted)" }}>
                  No entities captured yet.
                </p>
              ) : (
                topEntities.map((entity) => (
                  <div key={entity.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                    <div>
                      <p className="text-sm" style={{ color: "var(--fyi-text)" }}>{entity.name}</p>
                      <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--fyi-muted)" }}>
                        {entity.type}
                      </p>
                    </div>
                    <span className="text-sm" style={{ color: "var(--fyi-accent)" }}>
                      {entity._count.memories}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: "var(--fyi-accent)" }}>
              Momentum notes
            </p>
            <p className="mt-3 text-sm leading-6" style={{ color: "var(--fyi-muted)" }}>
              Track how often you are capturing new memories and which types dominate. This helps tune your context window and prompts.
            </p>
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm" style={{ color: "var(--fyi-text)" }}>
              Keep storing short, durable facts to strengthen your graph.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
