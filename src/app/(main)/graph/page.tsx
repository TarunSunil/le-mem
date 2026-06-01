"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { KnowledgeGraph } from "@/components/graph/KnowledgeGraph";
import { GraphFilters } from "@/components/graph/GraphFilters";
import useSWR from "swr";
import type { GraphData, EntityType } from "@/types";
import { ENTITY_LABELS, ENTITY_TYPE_ORDER, NODE_COLORS } from "@/lib/graph/theme";

export default function GraphPage() {
  const router = useRouter();
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
  const [activeTypes, setActiveTypes] = useState<EntityType[] | null>(null);

  const availableTypes = useMemo(() => {
    if (!graphData?.nodes?.length) return [];
    const types = new Set<EntityType>();
    for (const node of graphData.nodes) {
      if (node.type) types.add(node.type as EntityType);
    }
    return ENTITY_TYPE_ORDER.filter((type) => types.has(type));
  }, [graphData]);

  const selectedTypes = activeTypes ?? availableTypes;

  const filteredData = useMemo(() => {
    if (!graphData) return undefined;
    if (activeTypes === null) return graphData;
    if (activeTypes.length === 0) return { nodes: [], links: [] };

    const nodes = graphData.nodes.filter((node) => activeTypes.includes(node.type));
    const nodeIds = new Set(nodes.map((node) => node.id));
    const linkEndpointId = (endpoint: unknown) =>
      endpoint && typeof endpoint === "object" && "id" in endpoint
        ? String(endpoint.id)
        : String(endpoint);
    const links = graphData.links.filter((link) => {
      const sourceId = linkEndpointId(link.source);
      const targetId = linkEndpointId(link.target);
      return nodeIds.has(sourceId) && nodeIds.has(targetId);
    });

    return { nodes, links };
  }, [graphData, activeTypes]);

  const legendItems = useMemo(
    () => availableTypes.map((type) => [ENTITY_LABELS[type], NODE_COLORS[type]] as const),
    [availableTypes]
  );

  const nodeGroups = useMemo(() => {
    if (!filteredData?.nodes?.length) return [] as Array<[string, NonNullable<typeof filteredData>["nodes"]]>;
    const grouped = new Map<string, typeof filteredData.nodes>();
    for (const node of filteredData.nodes) {
      const key = node.type || "UNKNOWN";
      const list = grouped.get(key) ?? [];
      list.push(node);
      grouped.set(key, list);
    }
    return Array.from(grouped.entries());
  }, [filteredData]);

  const handleToggleType = (type: EntityType) => {
    setActiveTypes((prev) =>
      (prev ?? availableTypes).includes(type)
        ? (prev ?? availableTypes).filter((t) => t !== type)
        : [...(prev ?? availableTypes), type]
    );
  };

  const handleSelectAll = () => {
    setActiveTypes(availableTypes);
  };

  const handleClearAll = () => {
    setActiveTypes([]);
  };

  return (
    <div className="flex min-h-full flex-col px-4 py-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:px-container-padding md:py-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 md:gap-6">
        <section className="glass-panel border border-white/10 p-4 md:p-6">
          <div className="mt-3 max-w-2xl">
            <h1
              className="font-newsreader text-2xl leading-tight md:text-5xl"
              style={{ color: "var(--fyi-text)" }}
            >
              Watch memories, people, and projects connect in real time.
            </h1>
          </div>

          <div className="mt-4 grid gap-3 md:mt-6 md:grid-cols-3">
            {[
              [nodeCount.toString(), "nodes shown"],
              [linkCount.toString(), "relationships"],
              ["--", "context clusters"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-3 md:p-4">
                <div className="text-xl font-semibold md:text-2xl" style={{ color: "#e5e2e1" }}>
                  {value}
                </div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.18em] md:text-label-sm" style={{ color: "var(--fyi-muted)" }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-4 md:gap-6 xl:grid-cols-[1fr_280px]">
          {error && (
            <div
              className="rounded-lg border border-red-500 bg-red-500/10 p-4"
              style={{ color: "#ff6b6b" }}
            >
              Error: {error}
            </div>
          )}

          {!error && (
            <div className="space-y-4">
              <KnowledgeGraph data={filteredData || undefined} isLoading={isLoading} />

              {nodeGroups.length > 0 && (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="text-[10px] uppercase tracking-[0.22em]" style={{ color: "var(--fyi-accent)" }}>
                    Node list
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {nodeGroups.map(([type, nodes]) => (
                      <div key={type} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                        <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: "var(--fyi-muted)" }}>
                          {ENTITY_LABELS[type as EntityType] ?? type}
                        </p>
                        <div className="mt-2 space-y-1">
                          {nodes.slice(0, 6).map((node) => (
                            <button
                              key={node.id}
                              type="button"
                              onClick={() => node.id && router.push(`/contexts/${node.id}`)}
                              className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-xs transition hover:border-white/20"
                              style={{ color: "var(--fyi-text)" }}
                            >
                              <span className="truncate">{node.name}</span>
                              <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <aside className="rounded-3xl border border-white/10 bg-white/5 p-4 md:p-5">
            <h2
              className="text-lg font-newsreader md:text-headline-md"
              style={{ color: "var(--fyi-text)" }}
            >
              Legend
            </h2>

            <div className="mt-4 space-y-2 md:mt-5 md:space-y-3">
              {legendItems.map(([label, color]) => (
                <div
                  key={label}
                  className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 md:gap-3 md:px-4 md:py-3"
                >
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs md:text-body-md" style={{ color: "var(--fyi-muted)" }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <GraphFilters
              availableTypes={availableTypes}
              activeTypes={selectedTypes}
              onToggle={handleToggleType}
              onSelectAll={handleSelectAll}
              onClearAll={handleClearAll}
            />

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3 md:mt-6 md:p-4">
              <p
                className="text-[10px] uppercase tracking-[0.22em] md:text-label-sm"
                style={{ color: "var(--fyi-accent)" }}
              >
                Node interactions
              </p>
              <p
                className="mt-2 text-xs leading-5 md:mt-3 md:text-body-md md:leading-7"
                style={{ color: "var(--fyi-muted)" }}
              >
                Click a node to open its related context page. On touch devices, tap once to focus and tap again to open.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
