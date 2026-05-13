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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 border-t flex items-center justify-around px-2 z-40" style={{backgroundColor: "#131313", borderColor: "#44474a"}}>
      {NAV_ITEMS.map((item) => {
        const isActive = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center w-16 h-16 rounded-lg gap-1 transition-colors"
            style={{
              color: isActive ? "#b0b2ff" : "#c5c7c9",
              backgroundColor: isActive ? "#3131c0" : "transparent",
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
