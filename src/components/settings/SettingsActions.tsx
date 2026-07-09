"use client";

import { useState } from "react";

export function SettingsActions({ email }: { email: string }) {
  const [typedEmail, setTypedEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const canDelete = typedEmail.trim() === email;

  async function handleDelete() {
    if (!canDelete || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: typedEmail.trim() }),
      });
      if (!res.ok) {
        throw new Error("Failed to delete account");
      }
      window.location.href = "/login";
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <label className="text-xs uppercase tracking-[0.18em]" style={{ color: "var(--fyi-muted)" }}>
          Re-type {email}
        </label>
        <input
          value={typedEmail}
          onChange={(e) => setTypedEmail(e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
          style={{ color: "var(--fyi-text)" }}
          placeholder={email}
          autoComplete="off"
        />
      </div>
      <button
        type="button"
        disabled={!canDelete || busy}
        onClick={handleDelete}
        className="rounded-full px-4 py-2 text-sm transition-colors disabled:opacity-50"
        style={{ backgroundColor: "#5f1f1f", color: "#fce8e6" }}
      >
        {busy ? "Deleting..." : "Delete account and data"}
      </button>
      <p className="text-xs leading-5" style={{ color: "var(--fyi-muted)" }}>
        This button stays disabled until the email matches exactly.
      </p>
    </div>
  );
}