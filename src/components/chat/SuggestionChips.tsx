"use client";

import { TARUN_SUGGESTIONS } from "@/lib/tarun-context";

const SUGGESTIONS = TARUN_SUGGESTIONS;

interface SuggestionChipsProps {
  onSuggest?: (suggestion: string) => void;
}

export function SuggestionChips({ onSuggest }: SuggestionChipsProps) {
  return (
    <section className="flex flex-wrap gap-2">
      {SUGGESTIONS.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          onClick={() => onSuggest?.(suggestion)}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-label-sm text-on-surface-variant transition-colors hover:border-secondary-container/40 hover:bg-secondary-container/10 hover:text-on-surface"
        >
          {suggestion}
        </button>
      ))}
    </section>
  );
}