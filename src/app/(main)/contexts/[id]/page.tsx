import Link from "next/link";
import { notFound } from "next/navigation";
import { CONTEXT_DETAILS } from "@/lib/context-registry";

export default async function ContextDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = CONTEXT_DETAILS[id];

  if (!context) {
    notFound();
  }

  return (
    <div className="flex h-full flex-col px-container-padding py-6">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link href="/contexts" className="inline-flex items-center gap-2 text-label-sm text-on-surface-variant transition-colors hover:text-on-surface">
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back to Context Hub
          </Link>

          <span className="rounded-full border border-white/10 px-3 py-1 text-label-sm text-on-surface-variant">
            {context.id}
          </span>
        </div>

        <section className="glass-panel border border-white/10 p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-secondary-container px-3 py-1 text-label-sm text-on-secondary-container">
              {context.type}
            </span>
            <span className="rounded-full border border-white/10 px-3 py-1 text-label-sm text-on-surface-variant">
              Auto-generated wiki page
            </span>
          </div>

          <div className="mt-5 max-w-2xl">
            <h1 className="font-newsreader text-4xl md:text-6xl" style={{ color: "#e5e2e1" }}>
              {context.title}
            </h1>
            <p className="mt-4 text-body-md md:text-body-lg" style={{ color: "#c5c7c9" }}>
              {context.summary}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {context.categories?.map((category) => (
                <span key={category} className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-label-sm text-on-surface-variant">
                  {category}
                </span>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {context.facts.map(([label, value]) => (
            <div key={label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-label-sm uppercase tracking-[0.22em]" style={{ color: "#b0b2ff" }}>
                {label}
              </div>
              <div className="mt-2 text-body-md" style={{ color: "#e5e2e1" }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-5 md:p-6">
            <h2 className="text-headline-md font-newsreader" style={{ color: "#e5e2e1" }}>
              Recent notes
            </h2>
            <div className="mt-5 space-y-3">
              {context.recentNotes.map((note) => (
                <div key={note} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  <p className="text-body-md" style={{ color: "#c5c7c9" }}>
                    {note}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-5 md:p-6">
            <h2 className="text-headline-md font-newsreader" style={{ color: "#e5e2e1" }}>
              Context actions
            </h2>
            <div className="mt-5 space-y-3">
              {[
                "Open linked memories",
                "Create summary",
                "Inspect graph connections",
                "Add new note",
              ].map((action) => (
                <button
                  key={action}
                  type="button"
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-left text-body-md text-on-surface-variant transition-colors hover:border-secondary-container/40 hover:text-on-surface"
                >
                  {action}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}