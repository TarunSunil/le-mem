"use client";

import type { EntityType } from "@/types";
import { ENTITY_LABELS, NODE_COLORS } from "@/lib/graph/theme";

type GraphFiltersProps = {
  availableTypes: EntityType[];
  activeTypes: EntityType[];
  onToggle: (type: EntityType) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
};

export function GraphFilters({
  availableTypes,
  activeTypes,
  onToggle,
  onSelectAll,
  onClearAll,
}: GraphFiltersProps) {
  if (availableTypes.length === 0) return null;

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3 md:mt-6 md:p-4">
      <div
        className="text-[10px] uppercase tracking-[0.22em] md:text-label-sm"
        style={{ color: "var(--fyi-accent)" }}
      >
        Filters
      </div>
      <div className="mt-3 grid gap-2">
        {availableTypes.map((type) => {
          const isActive = activeTypes.includes(type);
          return (
            <button
              key={type}
              type="button"
              onClick={() => onToggle(type)}
              className={
                "flex items-center justify-between rounded-xl border px-3 py-2 text-left transition " +
                (isActive
                  ? "border-white/30 bg-white/10"
                  : "border-white/10 bg-black/20 hover:border-white/20")
              }
            >
              <span className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: NODE_COLORS[type] }}
                />
                <span className="text-xs md:text-body-md" style={{ color: "var(--fyi-text)" }}>
                  {ENTITY_LABELS[type]}
                </span>
              </span>
              <span
                className="text-[10px] uppercase tracking-[0.18em]"
                style={{ color: "var(--fyi-muted)" }}
              >
                {isActive ? "On" : "Off"}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSelectAll}
          className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] transition hover:border-white/30"
          style={{ color: "var(--fyi-muted)" }}
        >
          All
        </button>
        <button
          type="button"
          onClick={onClearAll}
          className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] transition hover:border-white/30"
          style={{ color: "var(--fyi-muted)" }}
        >
          None
        </button>
      </div>
    </div>
  );
}
