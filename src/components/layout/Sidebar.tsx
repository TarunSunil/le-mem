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
      style={{ backgroundColor: "#131313", borderColor: "#44474a" }}
    >
      <div className="mb-12">
        <h1 className="text-2xl font-newsreader font-bold" style={{color: "#e5e2e1"}}>
          Le Mem
        </h1>
        <p className="text-label-sm mt-1" style={{color: "#c5c7c9"}}>
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
                color: isActive ? "#b0b2ff" : "#c5c7c9",
                backgroundColor: isActive ? "#3131c0" : "transparent",
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

      <div className="pt-4 border-t" style={{borderColor: "#44474a"}}>
        <button
          type="button"
          className="w-full px-4 py-3 rounded-lg text-[#e5e2e1] transition-colors flex items-center gap-2"
          style={{backgroundColor: "#201f1f"}}
          onClick={() => signOut({ callbackUrl: "/login" })}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#2a2a2a")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#201f1f")}
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
