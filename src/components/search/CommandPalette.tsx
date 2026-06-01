"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface PaletteItem {
  id: string;
  title: string;
  summary: string;
  type: string;
  href: string;
}

export function CommandPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<PaletteItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (isShortcut) {
        event.preventDefault();
        setIsOpen(true);
      }

      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) return;
    setQuery("");
    setItems([]);
    setActiveIndex(0);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (query.trim().length < 3) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/memory/search", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: query.trim(), limit: 8 }),
          signal: controller.signal,
        });
        if (!response.ok) {
          setItems([]);
          return;
        }

        const data = await response.json();
        const results = (data.results || []) as Array<{
          id?: string;
          title?: string;
          name?: string;
          summary?: string;
          type?: string;
        }>;

        const mapped = results
          .filter((result) => result.id)
          .map((result) => {
            const type = result.type || "MEMORY";
            const title = result.title || result.name || "Memory";
            return {
              id: result.id as string,
              title,
              summary: result.summary || title,
              type,
              href: type === "MEMORY" ? "/timeline" : `/contexts/${result.id}`,
            };
          });

        setItems(mapped);
        setActiveIndex(0);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    }, 240);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [isOpen, query]);

  const activeItem = useMemo(() => items[activeIndex], [items, activeIndex]);

  const handleSelect = (item?: PaletteItem) => {
    if (!item) return;
    setIsOpen(false);
    setQuery("");
    router.push(item.href);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 pt-24 backdrop-blur-sm"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full max-w-[560px] rounded-3xl border border-white/10 bg-[#14110d] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-on-surface-variant">search</span>
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  if (items.length > 0) {
                    setActiveIndex((prev) => Math.min(prev + 1, items.length - 1));
                  }
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  if (items.length > 0) {
                    setActiveIndex((prev) => Math.max(prev - 1, 0));
                  }
                }
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSelect(activeItem);
                }
              }}
              placeholder="Search people, projects, topics..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-on-surface-variant md:text-body-md"
              aria-label="Command palette search"
            />
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em]"
              style={{ color: "var(--fyi-muted)" }}
            >
              Esc
            </button>
          </div>
        </div>

        <div className="max-h-[360px] overflow-y-auto px-3 py-3">
          {isLoading && (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs" style={{ color: "var(--fyi-muted)" }}>
              Searching...
            </div>
          )}
          {!isLoading && items.length === 0 && query.trim().length >= 3 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs" style={{ color: "var(--fyi-muted)" }}>
              No results yet.
            </div>
          )}
          <div className="mt-2 space-y-2">
            {items.map((item, index) => (
              <button
                key={`${item.type}-${item.id}`}
                type="button"
                onClick={() => handleSelect(item)}
                className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                  index === activeIndex
                    ? "border-white/30 bg-white/10"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
+                onMouseEnter={() => setActiveIndex(index)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: "var(--fyi-text)" }}>
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs" style={{ color: "var(--fyi-muted)" }}>
                      {item.summary}
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em]" style={{ color: "var(--fyi-muted)" }}>
                    {item.type.toLowerCase()}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
