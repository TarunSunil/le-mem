// src/components/layout/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/chat", icon: "chat_bubble_outline", label: "Chat" },
  { href: "/contexts", icon: "folder_open", label: "Contexts" },
  { href: "/graph", icon: "share", label: "Graph" },
  { href: "/timeline", icon: "schedule", label: "Timeline" },
  { href: "/search", icon: "search", label: "Search" },
  { href: "/insights", icon: "bar_chart", label: "Insights" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const displayName = session?.user?.name?.split(" ")[0] ?? "You";

  return (
    <aside
      className="hidden md:flex flex-col w-64 h-screen border-r fixed left-0 top-0 pt-8 px-4"
      style={{ backgroundColor: "var(--fyi-bg)", borderColor: "var(--fyi-border)" }}
    >
      <div className="mb-8">
        <h1 className="text-2xl font-newsreader font-bold" style={{color: "var(--fyi-text)"}}>
          FYI
        </h1>
        <p className="text-label-sm mt-1" style={{color: "var(--fyi-muted)"}}>
          Personal Memory OS
        </p>
      </div>

      <div className="mb-8 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
        {session?.user?.image ? (
          <img
            src={session.user.image}
            alt={session.user.name ?? "User avatar"}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm">
            <span className="material-symbols-outlined text-lg">person</span>
          </div>
        )}
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--fyi-text)" }}>
            {displayName}
          </p>
          <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: "var(--fyi-muted)" }}>
            Personal OS
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1 text-[10px] uppercase tracking-[0.2em]" style={{ color: "var(--fyi-muted)" }}>
          <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
          <span aria-label="Online">Online</span>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive && "font-medium"
              )}
              style={{
                color: isActive ? "var(--fyi-accent-soft)" : "var(--fyi-muted)",
                backgroundColor: isActive ? "var(--fyi-accent-strong)" : "transparent",
              }}
            >
              <span className="material-symbols-outlined text-xl">
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t" style={{borderColor: "var(--fyi-border)"}}>
        <button
          type="button"
          className="w-full px-4 py-3 rounded-lg transition-colors flex items-center gap-2"
          style={{backgroundColor: "var(--fyi-surface-2)", color: "var(--fyi-text)"}}
          onClick={() => signOut({ callbackUrl: "/login" })}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--fyi-surface-3)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--fyi-surface-2)")}
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
