import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { RecentContextTracker } from "@/components/contexts/RecentContextTracker";

export default async function ContextDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) notFound();

  const entity = await prisma.entity.findFirst({
    where: {
      id,
      user: { email: session.user.email },
    },
    include: {
      memories: {
        include: { memory: true },
        orderBy: { memory: { createdAt: "desc" } },
        take: 20,
      },
      fromRelations: {
        include: { toEntity: true },
        take: 10,
      },
    },
  });

  if (!entity) notFound();

  return (
    <div className="flex h-full flex-col px-4 py-4 md:px-container-padding md:py-6">
      <RecentContextTracker id={entity.id} label={entity.name} />
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-4 flex items-center justify-between gap-3 md:mb-6">
          <Link
            href="/contexts"
            className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-on-surface-variant transition-colors hover:text-on-surface md:text-label-sm md:tracking-normal"
          >
            <span className="material-symbols-outlined text-sm md:text-base">arrow_back</span>
            Back to Context Hub
          </Link>
          <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-on-surface-variant md:text-label-sm md:tracking-normal">
            {entity.type}
          </span>
        </div>

        <section className="glass-panel border border-white/10 p-5 md:p-8">
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <span className="rounded-full bg-secondary-container px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-on-secondary-container md:text-label-sm md:tracking-normal">
              Context
            </span>
            <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-on-surface-variant md:text-label-sm md:tracking-normal">
              Generated from your memories
            </span>
          </div>
          <div className="mt-4 max-w-2xl">
            <h1 className="font-newsreader text-2xl md:text-6xl" style={{ color: "#e5e2e1" }}>
              {entity.name}
            </h1>
            {entity.summary && (
              <p className="mt-2 text-xs leading-5 md:mt-3 md:text-body-md" style={{ color: "var(--fyi-muted)" }}>
                {entity.summary}
              </p>
            )}
          </div>
        </section>

        {entity.fromRelations.length > 0 && (
          <section className="mt-6 md:mt-8">
            <h2 className="mb-3 text-[10px] uppercase tracking-[0.24em]" style={{ color: "var(--fyi-accent)" }}>
              Connections
            </h2>
            <div className="flex flex-wrap gap-2">
              {entity.fromRelations.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/contexts/${rel.toEntityId}`}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs transition hover:border-white/20"
                  style={{ color: "var(--fyi-text)" }}
                >
                  {rel.label} → {rel.toEntity.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {entity.memories.length > 0 && (
          <section className="mt-6 space-y-3 md:mt-8">
            <h2 className="mb-3 text-[10px] uppercase tracking-[0.24em]" style={{ color: "var(--fyi-accent)" }}>
              Related Memories
            </h2>
            {entity.memories.map(({ memory }) => (
              <article
                key={memory.id}
                className="rounded-3xl border border-white/10 bg-white/5 p-4 md:p-5"
              >
                <p className="text-xs leading-5 md:text-body-md md:leading-7" style={{ color: "var(--fyi-muted)" }}>
                  {memory.content}
                </p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.18em]" style={{ color: "var(--fyi-accent)" }}>
                  {new Date(memory.createdAt).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                </p>
              </article>
            ))}
          </section>
        )}

        {entity.memories.length === 0 && (
          <div className="mt-6 rounded-3xl border border-dashed border-white/10 bg-white/5 p-5 text-center md:mt-8 md:p-6">
            <p className="text-xs leading-5 md:text-body-md" style={{ color: "var(--fyi-muted)" }}>
              No memories linked to this context yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}