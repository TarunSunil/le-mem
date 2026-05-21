import Link from "next/link";

export default async function ContextDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex h-full flex-col px-4 py-4 md:px-container-padding md:py-6">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-4 flex items-center justify-between gap-3 md:mb-6">
          <Link href="/contexts" className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-on-surface-variant transition-colors hover:text-on-surface md:text-label-sm md:tracking-normal">
            <span className="material-symbols-outlined text-sm md:text-base">arrow_back</span>
            Back to Context Hub
          </Link>

          <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-on-surface-variant md:text-label-sm md:tracking-normal">
            {id}
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
              Context not generated yet
            </h1>
            <p className="mt-2 text-xs leading-5 md:mt-3 md:text-body-md" style={{ color: "var(--fyi-muted)" }}>
              FYI will build this page once you add memories related to “{id}”.
            </p>
          </div>
        </section>
        <div className="mt-6 rounded-3xl border border-dashed border-white/10 bg-white/5 p-5 text-center md:mt-8 md:p-6">
          <p className="text-xs leading-5 md:text-body-md" style={{ color: "var(--fyi-muted)" }}>
            Start a conversation in chat to let FYI generate this context page.
          </p>
        </div>
      </div>
    </div>
  );
}