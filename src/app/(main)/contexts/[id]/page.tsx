import Link from "next/link";

export default async function ContextDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex h-full flex-col px-container-padding py-6">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link href="/contexts" className="inline-flex items-center gap-2 text-label-sm text-on-surface-variant transition-colors hover:text-on-surface">
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back to Context Hub
          </Link>

          <span className="rounded-full border border-white/10 px-3 py-1 text-label-sm text-on-surface-variant">
            {id}
          </span>
        </div>

        <section className="glass-panel border border-white/10 p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-secondary-container px-3 py-1 text-label-sm text-on-secondary-container">
              Context
            </span>
            <span className="rounded-full border border-white/10 px-3 py-1 text-label-sm text-on-surface-variant">
              Generated from your memories
            </span>
          </div>

          <div className="mt-5 max-w-2xl">
            <h1 className="font-newsreader text-4xl md:text-6xl" style={{ color: "#e5e2e1" }}>
              Context not generated yet
            </h1>
            <p className="mt-4 text-body-md md:text-body-lg" style={{ color: "var(--fyi-muted)" }}>
              FYI will build this page once you add memories related to “{id}”.
            </p>
          </div>
        </section>
        <div className="mt-8 rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-center">
          <p className="text-body-md" style={{ color: "var(--fyi-muted)" }}>
            Start a conversation in chat to let FYI generate this context page.
          </p>
        </div>
      </div>
    </div>
  );
}