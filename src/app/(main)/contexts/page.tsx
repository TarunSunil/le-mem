// src/app/(main)/contexts/page.tsx

import Link from "next/link";
import { CONTEXT_GROUPS } from "@/lib/context-registry";

export default function ContextsPage() {
  const contextCount = CONTEXT_GROUPS.reduce(
    (total, group) => total + group.contexts.length,
    0
  );
  const categoryCount = CONTEXT_GROUPS.length;
  const stats = [
    [contextCount.toString(), "contexts active"],
    ["0", "linked memories"],
    [categoryCount.toString(), "categories"],
  ];

  return (
    <div className="flex h-full flex-col px-container-padding py-6">
      <div className="mx-auto w-full max-w-6xl">
        <section className="glass-panel border border-white/10 p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-secondary-container px-3 py-1 text-label-sm text-on-secondary-container">
              Personal Profile
            </span>
            <span className="rounded-full border border-white/10 px-3 py-1 text-label-sm text-on-surface-variant">
              Categorized memory pages
            </span>
          </div>

          <div className="mt-5 max-w-2xl">
            <h1 className="font-newsreader text-3xl leading-tight md:text-5xl" style={{ color: "var(--fyi-text)" }}>
              Everything you know, organized around your profile, projects, and working domains.
            </h1>
            <p className="mt-4 text-body-md md:text-body-lg" style={{ color: "var(--fyi-muted)" }}>
              Each context page grows automatically as new memories arrive. Open one to see the notes, relationships, and categories clustered around that entity.
            </p>
          </div>
        </section>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {stats.map(([value, label]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-2xl font-semibold" style={{ color: "var(--fyi-text)" }}>
                {value}
              </div>
              <div className="mt-1 text-label-sm" style={{ color: "var(--fyi-muted)" }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {CONTEXT_GROUPS.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-white/10 bg-white/5 p-10 text-center">
            <h2 className="text-headline-md font-newsreader" style={{ color: "var(--fyi-text)" }}>
              No contexts yet
            </h2>
            <p className="mt-3 text-body-md" style={{ color: "var(--fyi-muted)" }}>
              Add memories in chat and FYI will automatically build context pages as it learns.
            </p>
          </div>
        ) : (
          CONTEXT_GROUPS.map((group) => (
            <div key={group.id} className="mt-10">
              <div className="mb-6">
                <h2 className="font-newsreader text-2xl md:text-3xl" style={{ color: "var(--fyi-text)" }}>
                  {group.title}
                </h2>
                {group.description && (
                  <p className="mt-2 text-body-sm md:text-body-md" style={{ color: "var(--fyi-muted)" }}>
                    {group.description}
                  </p>
                )}
              </div>

              {group.contexts.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {group.contexts.map((context) => (
                    <Link
                      key={context.id}
                      href={`/contexts/${context.id}`}
                      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 transition-all hover:border-white/20 hover:bg-white/10"
                    >
                      <div className="relative z-10">
                        <div className="flex items-start justify-between">
                          <div>
                            <span
                              className="mb-2 inline-block rounded-full px-2 py-1 text-label-xs"
                              style={{
                                backgroundColor: `${context.accent}20`,
                                color: context.accent,
                              }}
                            >
                              {context.label}
                            </span>
                            <h3 className="mt-3 font-newsreader text-xl leading-tight" style={{ color: "var(--fyi-text)" }}>
                              {context.title}
                            </h3>
                          </div>
                        </div>
                        <p className="mt-3 text-body-sm" style={{ color: "var(--fyi-muted)" }}>
                          {context.summary}
                        </p>
                        {context.categories && context.categories.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {context.categories.slice(0, 3).map((cat) => (
                              <span
                                key={cat}
                                className="rounded-full border border-white/10 px-2 py-1 text-label-xs"
                                style={{ color: "var(--fyi-muted)" }}
                              >
                                {cat}
                              </span>
                            ))}
                          </div>
                        )}
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
          ))
        )}
      </div>
    </div>
  );
}
