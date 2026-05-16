// src/components/layout/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/chat", icon: "chat_bubble_outline", label: "Chat" },
  { href: "/contexts", icon: "folder_open", label: "Contexts" },
  { href: "/graph", icon: "share", label: "Graph" },
  { href: "/timeline", icon: "schedule", label: "Timeline" },
  { href: "/search", icon: "search", label: "Search" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden md:flex flex-col w-64 h-screen border-r fixed left-0 top-0 pt-8 px-4"
      style={{ backgroundColor: "var(--fyi-bg)", borderColor: "var(--fyi-border)" }}
    >
      <div className="mb-12">
        <h1 className="text-2xl font-newsreader font-bold" style={{color: "var(--fyi-text)"}}>
          FYI
        </h1>
        <p className="text-label-sm mt-1" style={{color: "var(--fyi-muted)"}}>
          Personal Memory OS
        </p>
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
