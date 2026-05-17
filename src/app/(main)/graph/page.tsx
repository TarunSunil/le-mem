"use client";

import { KnowledgeGraph } from "@/components/graph/KnowledgeGraph";
import useSWR from "swr";
import type { GraphData } from "@/types";

const LEGEND = [
  ["People", "#e07a5f"],
  ["Projects", "#2a9d8f"],
  ["Travel", "#f2cc8f"],
  ["Topics", "#6f665a"],
];

export default function GraphPage() {
  const fetcher = async (url: string) => {
    const response = await fetch(url, { credentials: "include" });
    if (!response.ok) {
      throw new Error("Failed to fetch graph data");
    }
    return (await response.json()) as GraphData;
  };

  const { data: graphData, error, isLoading } = useSWR("/api/graph", fetcher, {
    dedupingInterval: 30000,
    revalidateOnFocus: false,
  });

  const nodeCount = graphData?.nodes.length || 0;
  const linkCount = graphData?.links.length || 0;

  return (
    <div className="flex min-h-full flex-col px-container-padding py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="glass-panel border border-white/10 p-6 md:p-8">
          <div className="mt-5 max-w-2xl">
            <h1
              className="font-newsreader text-3xl leading-tight md:text-5xl"
              style={{ color: "var(--fyi-text)" }}
            >
              Watch memories, people, and projects connect in real time.
            </h1>
            <p
              className="mt-4 text-body-md md:text-body-lg"
              style={{ color: "var(--fyi-muted)" }}
            >
              The graph is the hidden structure behind FYI. Every new memory
              can add nodes and edges, turning a note app into a living network
              of context.
            </p>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {[
              [nodeCount.toString(), "nodes shown"],
              [linkCount.toString(), "relationships"],
              ["--", "context clusters"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-2xl font-semibold" style={{ color: "#e5e2e1" }}>
                  {value}
                </div>
                <div className="mt-1 text-label-sm" style={{ color: "var(--fyi-muted)" }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
          {error && (
            <div
              className="rounded-lg border border-red-500 bg-red-500/10 p-4"
              style={{ color: "#ff6b6b" }}
            >
              Error: {error}
            </div>
          )}

          {!error && <KnowledgeGraph data={graphData || undefined} isLoading={isLoading} />}

          <aside className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <h2
              className="text-headline-md font-newsreader"
              style={{ color: "var(--fyi-text)" }}
            >
              Legend
            </h2>

            <div className="mt-5 space-y-3">
              {LEGEND.map(([label, color]) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                >
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-body-md" style={{ color: "var(--fyi-muted)" }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
              <p
                className="text-label-sm uppercase tracking-[0.2em]"
                style={{ color: "var(--fyi-accent)" }}
              >
                Node interactions
              </p>
              <p
                className="mt-3 text-body-md leading-7"
                style={{ color: "var(--fyi-muted)" }}
              >
                Clickable nodes will open the related context page once live data
                is connected to the graph API.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
