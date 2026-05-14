// src/app/(main)/contexts/page.tsx

import Link from "next/link";
import { CONTEXT_GROUPS } from "@/lib/context-registry";

const STATS = [
  ["9", "contexts active"],
  ["18", "linked memories"],
  ["6", "categories"],
];

export default function ContextsPage() {
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
            <h1 className="font-newsreader text-3xl leading-tight md:text-5xl" style={{ color: "#e5e2e1" }}>
              Everything you know, organized around your profile, projects, and working domains.
            </h1>
            <p className="mt-4 text-body-md md:text-body-lg" style={{ color: "#c5c7c9" }}>
              Each context page grows automatically as new memories arrive. Open one to see the notes, relationships, and categories clustered around that entity.
            </p>
          </div>
        </section>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {STATS.map(([value, label]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-2xl font-semibold" style={{ color: "#e5e2e1" }}>
                {value}
              </div>
              <div className="mt-1 text-label-sm" style={{ color: "#c5c7c9" }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Render contexts grouped by category */}
        {CONTEXT_GROUPS.map((group) => (
          <div key={group.id} className="mt-10">
            {/* Category header */}
            <div className="mb-6">
              <h2 className="font-newsreader text-2xl md:text-3xl" style={{ color: "#e5e2e1" }}>
                {group.title}
              </h2>
              {group.description && (
                <p className="mt-2 text-body-sm md:text-body-md" style={{ color: "#c5c7c9" }}>
                  {group.description}
                </p>
              )}
            </div>

            {/* Contexts in group */}
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
                          <h3 className="mt-3 font-newsreader text-xl leading-tight" style={{ color: "#e5e2e1" }}>
                            {context.title}
                          </h3>
                        </div>
                      </div>
                      <p className="mt-3 text-body-sm" style={{ color: "#c5c7c9" }}>
                        {context.summary}
                      </p>
                      {context.categories && context.categories.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {context.categories.slice(0, 3).map((cat) => (
                            <span
                              key={cat}
                              className="rounded-full border border-white/10 px-2 py-1 text-label-xs"
                              style={{ color: "#c5c7c9" }}
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
                <p style={{ color: "#c5c7c9" }}>No items in this category yet</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
