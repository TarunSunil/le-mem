// src/app/(main)/search/page.tsx

"use client";

import { useMemo, useState, useEffect } from "react";
import { TARUN_SEARCH_RESULTS, TARUN_SUGGESTIONS } from "@/lib/tarun-context";

const SUGGESTED_QUERIES = TARUN_SUGGESTIONS;

const SAMPLE_RESULTS = TARUN_SEARCH_RESULTS;

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

function ResultCard({ title, summary }: { title: string; summary: string }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-5 transition-colors hover:border-secondary-container/30 hover:bg-white/8">
      <h3 className="text-body-lg font-medium" style={{ color: "#e5e2e1" }}>
        {title}
      </h3>
      <p className="mt-3 text-body-md leading-7" style={{ color: "#c5c7c9" }}>
        {summary}
      </p>
    </article>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState("What do I know about Tarun?");
  const [results, setResults] = useState<SearchResults>(SAMPLE_RESULTS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce search API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        searchMemories(query);
      } else {
        setResults(SAMPLE_RESULTS);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const searchMemories = async (searchQuery: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/memory/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, limit: 10 }),
      });

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();

      // Parse results from API
      const people: SearchResult[] = [];
      const snippets: SearchResult[] = [];
      const projects: SearchResult[] = [];

      (data.results || []).forEach((result: any) => {
        if (result.type === "PERSON") {
          people.push({
            id: result.id,
            name: result.name,
            summary: result.summary || result.name,
            type: result.type,
          });
        } else if (result.type === "PROJECT") {
          projects.push({
            id: result.id,
            title: result.name,
            summary: result.summary || result.name,
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      console.error("Search error:", err);
      // Fall back to sample results on error
      setResults(SAMPLE_RESULTS);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col px-container-padding py-6">
      <div className="mx-auto w-full max-w-6xl">
        <section className="glass-panel border border-white/10 p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-secondary-container px-3 py-1 text-label-sm text-on-secondary-container">
              Smart Retrieval
            </span>
            <span className="rounded-full border border-white/10 px-3 py-1 text-label-sm text-on-surface-variant">
              Semantic search
            </span>
          </div>

          <div className="mt-5 max-w-2xl">
            <h1
              className="font-newsreader text-3xl leading-tight md:text-5xl"
              style={{ color: "#e5e2e1" }}
            >
              Search by meaning, not just by keywords.
            </h1>
            <p
              className="mt-4 text-body-md md:text-body-lg"
              style={{ color: "#c5c7c9" }}
            >
              Ask for the memory, person, project, or category you remember and Le Mem
              will surface the related notes, snippets, and context pages.
            </p>
          </div>

          <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-3 md:p-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-xl text-on-surface-variant">
                search
              </span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                disabled={isLoading}
                placeholder="Search people, snippets, projects, or categories..."
                className="w-full bg-transparent text-body-md outline-none placeholder:text-on-surface-variant disabled:opacity-50"
              />
              <button
                type="button"
                disabled={isLoading}
                onClick={() => searchMemories(query)}
                className="rounded-full bg-secondary-container px-4 py-2 text-label-sm text-on-secondary-container transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isLoading ? "..." : "Search"}
              </button>
            </div>
          </div>

          {error && (
            <div
              className="mt-4 rounded-lg border border-red-500 bg-red-500/10 p-3"
              style={{ color: "#ff6b6b" }}
            >
              Error: {error}
            </div>
          )}
        </section>

        <section className="mt-4 flex flex-wrap gap-2">
          {SUGGESTED_QUERIES.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setQuery(suggestion)}
              disabled={isLoading}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-label-sm text-on-surface-variant transition-colors hover:border-secondary-container/40 hover:bg-secondary-container/10 hover:text-on-surface disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <section className="space-y-4 lg:col-span-1">
            <div className="flex items-center justify-between">
              <h2
                className="text-headline-md font-newsreader"
                style={{ color: "#e5e2e1" }}
              >
                People
              </h2>
              <span className="text-label-sm text-on-surface-variant">
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
                className="text-headline-md font-newsreader"
                style={{ color: "#e5e2e1" }}
              >
                Memory Snippets
              </h2>
              <span className="text-label-sm text-on-surface-variant">
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
                className="text-headline-md font-newsreader"
                style={{ color: "#e5e2e1" }}
              >
                Project Contexts
              </h2>
              <span className="text-label-sm text-on-surface-variant">
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
