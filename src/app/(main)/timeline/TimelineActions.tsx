"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface TimelineActionsProps {
  id: string;
  content: string;
}

export function TimelineActions({ id, content }: TimelineActionsProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(content);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const nextContent = draft.trim();
    if (!nextContent) return;

    setIsBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/memory/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: nextContent }),
      });
      if (!response.ok) throw new Error(`Update failed (${response.status})`);
      setIsEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setIsBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this memory?")) return;

    setIsBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/memory/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error(`Delete failed (${response.status})`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setIsBusy(false);
    }
  };

  if (isEditing) {
    return (
      <div className="mt-4 space-y-3">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="min-h-24 w-full resize-y rounded-2xl border border-white/10 bg-black/20 p-3 text-sm outline-none"
          style={{ color: "var(--fyi-text)" }}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={save}
            disabled={isBusy || !draft.trim()}
            className="rounded-full bg-secondary-container px-3 py-1.5 text-xs text-on-secondary-container disabled:opacity-50"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(content);
              setIsEditing(false);
            }}
            disabled={isBusy}
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs disabled:opacity-50"
            style={{ color: "var(--fyi-muted)" }}
          >
            Cancel
          </button>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        disabled={isBusy}
        className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-xs disabled:opacity-50"
        style={{ color: "var(--fyi-muted)" }}
      >
        <span className="material-symbols-outlined text-sm">edit</span>
        Edit
      </button>
      <button
        type="button"
        onClick={remove}
        disabled={isBusy}
        className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-xs disabled:opacity-50"
        style={{ color: "var(--fyi-muted)" }}
      >
        <span className="material-symbols-outlined text-sm">delete</span>
        Delete
      </button>
      {error && <p className="basis-full text-xs text-red-400">{error}</p>}
    </div>
  );
}
