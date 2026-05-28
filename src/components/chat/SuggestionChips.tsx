"use client";

const DEFAULT_SUGGESTIONS = [
  "I'm a software engineer at [company]",
  "My hobbies include...",
  "I'm working on a project called...",
];

interface SuggestionChipsProps {
  onSuggest?: (suggestion: string) => void;
  suggestions?: string[];
}

export function SuggestionChips({
  onSuggest,
  suggestions = DEFAULT_SUGGESTIONS,
}: SuggestionChipsProps) {
  return (
    <section className="flex flex-wrap gap-2">
      {suggestions.map((suggestion) => (
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
