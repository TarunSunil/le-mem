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
    <div className="flex min-h-full flex-col px-container-padding py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto w-full max-w-5xl">
        <section className="glass-panel border border-white/10 p-6 md:p-8">
          <div className="mt-5 max-w-2xl">
            <h1 className="font-newsreader text-3xl leading-tight md:text-5xl" style={{ color: "var(--fyi-text)" }}>
              Every memory, ordered by time and context.
            </h1>
            <p className="mt-4 text-body-md md:text-body-lg" style={{ color: "var(--fyi-muted)" }}>
              The timeline turns scattered notes into a story. You can scan what happened today, revisit what mattered yesterday, and trace how a topic evolved across the week.
            </p>
          </div>
        </section>

        <Suspense fallback={<TimelineSkeleton />}>
          <TimelineContent />
        </Suspense>
      </div>
    </div>
  );
}