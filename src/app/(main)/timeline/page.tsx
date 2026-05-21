import { Suspense } from "react";
import { TimelineContent } from "./TimelineContent";

function TimelineSkeleton() {
  return (
    <div className="mt-8 space-y-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="h-24 animate-pulse rounded-3xl border border-white/10 bg-white/5 p-5"
        />
      ))}
    </div>
  );
}

export default function TimelinePage() {
  return (
    <div className="flex min-h-full flex-col px-4 py-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:px-container-padding md:py-6">
      <div className="mx-auto w-full max-w-5xl">
        <section className="glass-panel border border-white/10 p-4 md:p-6">
          <div className="mt-3 max-w-2xl">
            <h1 className="font-newsreader text-2xl leading-tight md:text-5xl" style={{ color: "var(--fyi-text)" }}>
              Every memory, ordered by time and context.
            </h1>
          </div>
        </section>

        <Suspense fallback={<TimelineSkeleton />}>
          <TimelineContent />
        </Suspense>
      </div>
    </div>
  );
}