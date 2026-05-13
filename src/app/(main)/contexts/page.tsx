// src/app/(main)/contexts/page.tsx

import Link from "next/link";
import { CONTEXTS } from "@/lib/context-registry";

const STATS = [
  ["6", "contexts active"],
  ["18", "linked memories"],
  ["7", "profile categories"],
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

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {CONTEXTS.map((context) => (
            <Link
              key={context.id}
              href={`/contexts/${context.id}`}
              className="group rounded-3xl border border-white/10 bg-white/5 p-5 transition-colors hover:border-white/20 hover:bg-white/8"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-label-sm uppercase tracking-[0.24em]" style={{ color: context.accent }}>
                    {context.label}
                  </p>
                  <h2 className="mt-2 text-2xl font-newsreader" style={{ color: "#e5e2e1" }}>
                    {context.title}
                  </h2>
                  {context.categories ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {context.categories.slice(0, 4).map((category) => (
                        <span
                          key={category}
                          className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-label-sm text-on-surface-variant"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/20 text-on-surface-variant transition-colors group-hover:bg-secondary-container group-hover:text-on-secondary-container">
                  <span className="material-symbols-outlined text-xl">arrow_forward</span>
                </div>
              </div>

              <p className="mt-4 text-body-md leading-7" style={{ color: "#c5c7c9" }}>
                {context.summary}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
