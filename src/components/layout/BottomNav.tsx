// src/components/layout/BottomNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/chat", icon: "chat_bubble_outline", label: "Chat" },
  { href: "/contexts", icon: "folder_open", label: "Contexts" },
  { href: "/graph", icon: "share", label: "Graph" },
  { href: "/timeline", icon: "schedule", label: "Timeline" },
  { href: "/search", icon: "search", label: "Search" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex h-[calc(5rem+env(safe-area-inset-bottom))] items-start justify-around border-t px-2 pt-2 pb-[env(safe-area-inset-bottom)]" style={{backgroundColor: "var(--fyi-bg)", borderColor: "var(--fyi-border)"}}>
      {NAV_ITEMS.map((item) => {
        const isActive = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}
            className="flex flex-col items-center justify-center w-16 h-16 rounded-lg gap-1 transition-colors"
            style={{
              color: isActive ? "var(--fyi-accent-soft)" : "var(--fyi-muted)",
              backgroundColor: isActive ? "var(--fyi-accent-strong)" : "transparent",
            }}
          >
            <span className="material-symbols-outlined text-lg">
              {item.icon}
            </span>
            <span className="text-label-sm">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
