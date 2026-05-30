// src/app/(main)/search/page.tsx

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { localFuzzySearch } from "@/lib/clientSearch";

interface SearchResult {
  id?: string;
  name?: string;
  title?: string;
  summary: string;
  type?: string;
}

interface SearchResults {
  people: SearchResult[];
  snippets: SearchResult[];
  projects: SearchResult[];
}

interface ApiSearchResult {
  id?: string;
  name?: string;
  title?: string;
  summary?: string;
  content?: string;
  type?: string;
}

function ResultCard({ title, summary }: { title: string; summary: string }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-4 transition-colors hover:border-secondary-container/30 hover:bg-white/8 md:p-5">
      <h3 className="text-sm font-medium md:text-body-lg" style={{ color: "var(--fyi-text)" }}>
        {title}
      </h3>
      <p className="mt-2 text-xs leading-5 md:mt-3 md:text-body-md md:leading-7" style={{ color: "var(--fyi-muted)" }}>
        {summary}
      </p>
    </article>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({
    people: [],
    snippets: [],
    projects: [],
  });
  const [recentContexts, setRecentContexts] = useState<Array<{ id: string; label: string }>>([]);
  const [entityStats, setEntityStats] = useState<Record<string, number>>({});
  const [cachedMemories, setCachedMemories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("le-mem:recent-contexts");
      const parsed = stored ? (JSON.parse(stored) as Array<{ id: string; label: string }>) : [];
      if (Array.isArray(parsed)) setRecentContexts(parsed.slice(0, 5));
    } catch {
      setRecentContexts([]);
    }

    try {
      const stored = sessionStorage.getItem("le-mem:search-cache");
      const parsed = stored ? (JSON.parse(stored) as string[]) : [];
      if (Array.isArray(parsed)) setCachedMemories(parsed);
    } catch {
      setCachedMemories([]);
    }
  }, [cachedMemories]);

  useEffect(() => {
    const loadEntityStats = async () => {
      try {
        const response = await fetch("/api/graph", { credentials: "include" });
        if (!response.ok) return;
        const data = (await response.json()) as { nodes?: Array<{ type?: string }> };
        const counts: Record<string, number> = {};
        for (const node of data.nodes ?? []) {
          if (!node.type) continue;
          counts[node.type] = (counts[node.type] || 0) + 1;
        }
        setEntityStats(counts);
      } catch {
        setEntityStats({});
      }
    };

    void loadEntityStats();
  }, []);

  const searchMemories = useCallback(async (searchQuery: string, signal?: AbortSignal) => {
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length < 3) {
      setResults({ people: [], snippets: [], projects: [] });
      setError(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/memory/search", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmedQuery, limit: 10 }),
        signal,
      });

      if (!response.ok) {
        let errorMessage = `Search failed (${response.status})`;
        try {
          const contentType = response.headers.get("content-type") ?? "";
          if (contentType.includes("application/json")) {
            const body = await response.json();
            if (body?.error) errorMessage = body.error;
            else if (body?.details) errorMessage = `${errorMessage}: ${body.details}`;
          } else {
            const text = await response.text();
            if (text.trim()) errorMessage = `${errorMessage}: ${text}`;
          }
        } catch {
          // ignore parsing errors
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Parse results from API
      const people: SearchResult[] = [];
      const snippets: SearchResult[] = [];
      const projects: SearchResult[] = [];

      ((data.results || []) as ApiSearchResult[]).forEach((result) => {
        if (result.type === "PERSON") {
          people.push({
            id: result.id,
            name: result.name,
            summary: result.summary || result.name || "Person",
            type: result.type,
          });
        } else if (result.type === "PROJECT") {
          projects.push({
            id: result.id,
            title: result.name,
            summary: result.summary || result.name || "Project",
            type: result.type,
          });
        } else {
          snippets.push({
            id: result.id,
            title: result.name || "Memory",
            summary: result.summary || result.content || "No summary available",
            type: result.type,
          });
        }
      });

      setResults({ people, snippets, projects });
      const memoryTitles = snippets
        .map((item) => item.title || item.summary)
        .filter((value): value is string => Boolean(value));
      if (memoryTitles.length > 0) {
        setCachedMemories(memoryTitles);
        sessionStorage.setItem("le-mem:search-cache", JSON.stringify(memoryTitles));
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Search failed");
      console.error("Search error:", err);
      const fallback = localFuzzySearch(trimmedQuery, cachedMemories);
      if (fallback.length > 0) {
        setResults({
          people: [],
          projects: [],
          snippets: fallback.map((title, index) => ({
            id: `fallback-${index}`,
            title,
            summary: title,
            type: "MEMORY",
          })),
        });
        return;
      }
      setResults({ people: [], snippets: [], projects: [] });
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  // Debounce search API calls and cancel stale requests.
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void searchMemories(query, controller.signal);
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, searchMemories]);

  const entitySummary = useMemo(() => {
    const entries = Object.entries(entityStats);
    if (entries.length === 0) return [];
    return entries
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([type, count]) => `${count} ${type.toLowerCase()}`);
  }, [entityStats]);

  const isEmpty =
    !isLoading &&
    !error &&
    results.people.length === 0 &&
    results.snippets.length === 0 &&
    results.projects.length === 0;

  return (
    <div className="flex min-h-full flex-col px-4 py-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:px-container-padding md:py-6">
      <div className="mx-auto w-full max-w-6xl">
        <section className="glass-panel border border-white/10 p-4 md:p-6">
          <div className="mt-3 max-w-2xl">
            <h1
              className="font-newsreader text-2xl leading-tight md:text-5xl"
              style={{ color: "var(--fyi-text)" }}
            >
              Search by meaning, not just by keywords.
            </h1>
          </div>

          <div className="mt-4 rounded-3xl border border-white/10 bg-black/20 p-2 md:mt-6 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <span className="material-symbols-outlined text-lg text-on-surface-variant md:text-xl">
                search
              </span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                disabled={isLoading}
                placeholder="Search people, snippets, projects, or categories..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-on-surface-variant disabled:opacity-50 md:text-body-md"
              />
              <button
                type="button"
                disabled={isLoading || query.trim().length < 3}
                onClick={() => searchMemories(query)}
                className="rounded-full bg-secondary-container px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-on-secondary-container transition-opacity hover:opacity-90 disabled:opacity-50 md:px-4 md:py-2 md:text-label-sm md:tracking-normal"
              >
                {isLoading ? "..." : "Search"}
              </button>
            </div>
          </div>

          {error && (
            <div
              className="mt-3 rounded-lg border border-red-500 bg-red-500/10 p-3 text-xs leading-5 md:mt-4 md:text-body-md"
              style={{ color: "#ff6b6b" }}
            >
              Error: {error}
            </div>
          )}
        </section>

        {isEmpty && !query.trim() && (
          <section className="mt-4 grid gap-4 md:mt-6 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-[10px] uppercase tracking-[0.24em]" style={{ color: "var(--fyi-accent)" }}>
                Recently viewed
              </p>
              <div className="mt-3 space-y-2">
                {recentContexts.length === 0 ? (
                  <p className="text-xs leading-5" style={{ color: "var(--fyi-muted)" }}>
                    No recent contexts yet. Open a context page to pin it here.
                  </p>
                ) : (
                  recentContexts.map((context) => (
                    <button
                      key={context.id}
                      type="button"
                      onClick={() => setQuery(context.label)}
                      className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-left text-xs transition hover:border-white/20"
                      style={{ color: "var(--fyi-text)" }}
                    >
                      {context.label}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-[10px] uppercase tracking-[0.24em]" style={{ color: "var(--fyi-accent)" }}>
                Entity mix
              </p>
              <div className="mt-3 space-y-2">
                {entitySummary.length === 0 ? (
                  <p className="text-xs leading-5" style={{ color: "var(--fyi-muted)" }}>
                    No entities detected yet. Store a few memories to see your mix.
                  </p>
                ) : (
                  entitySummary.map((item) => (
                    <div key={item} className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs" style={{ color: "var(--fyi-text)" }}>
                      {item}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-[10px] uppercase tracking-[0.24em]" style={{ color: "var(--fyi-accent)" }}>
                Quick searches
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["people", "projects", "travel", "health", "recent"].map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => setQuery(term)}
                    className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.2em] transition hover:border-white/20"
                    style={{ color: "var(--fyi-muted)" }}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        <div className="mt-6 grid gap-5 md:mt-8 md:gap-6 lg:grid-cols-3">
          <section className="space-y-4 lg:col-span-1">
            <div className="flex items-center justify-between">
              <h2
                className="text-lg font-newsreader md:text-headline-md"
                style={{ color: "#e5e2e1" }}
              >
                People
              </h2>
              <span className="text-[11px] uppercase tracking-[0.18em] text-on-surface-variant md:text-label-sm md:tracking-normal">
                {results.people.length}
              </span>
            </div>
            <div className="space-y-3">
              {results.people.map((item) => (
                <ResultCard
                  key={item.id || item.name}
                  title={item.name || "Person"}
                  summary={item.summary}
                />
              ))}
            </div>
          </section>

          <section className="space-y-4 lg:col-span-1">
            <div className="flex items-center justify-between">
              <h2
                className="text-lg font-newsreader md:text-headline-md"
                style={{ color: "#e5e2e1" }}
              >
                Memory Snippets
              </h2>
              <span className="text-[11px] uppercase tracking-[0.18em] text-on-surface-variant md:text-label-sm md:tracking-normal">
                {results.snippets.length}
              </span>
            </div>
            <div className="space-y-3">
              {results.snippets.map((item) => (
                <ResultCard
                  key={item.id || item.title}
                  title={item.title || "Memory"}
                  summary={item.summary}
                />
              ))}
            </div>
          </section>

          <section className="space-y-4 lg:col-span-1">
            <div className="flex items-center justify-between">
              <h2
                className="text-lg font-newsreader md:text-headline-md"
                style={{ color: "#e5e2e1" }}
              >
                Project Contexts
              </h2>
              <span className="text-[11px] uppercase tracking-[0.18em] text-on-surface-variant md:text-label-sm md:tracking-normal">
                {results.projects.length}
              </span>
            </div>
            <div className="space-y-3">
              {results.projects.map((item) => (
                <ResultCard
                  key={item.id || item.title}
                  title={item.title || "Project"}
                  summary={item.summary}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
