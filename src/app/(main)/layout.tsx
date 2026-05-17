// src/app/(main)/layout.tsx

import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { TopBar } from "@/components/layout/TopBar";
import { getCachedSession } from "@/lib/auth/get-session";
import { redirect } from "next/navigation";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCachedSession();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-dvh flex-col md:flex-row overflow-x-hidden" style={{ backgroundColor: "var(--fyi-bg)" }}>
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile TopBar */}
      <TopBar />

      {/* Main Content */}
      <main className="min-h-0 flex-1 md:ml-64 pt-14 md:pt-0 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0 overflow-visible">
        <div className="min-h-full w-full">{children}</div>
      </main>

      {/* Mobile Bottom Nav */}
      <BottomNav />

      {/* Ambient Orbs Background */}
      <div className="fixed -z-10 inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-0 left-1/4 h-96 w-96 blur-3xl opacity-20"
          style={{ background: "linear-gradient(to right, rgba(224, 122, 95, 0.7), transparent)" }}
        />
        <div
          className="absolute bottom-1/4 right-1/3 h-96 w-96 blur-3xl opacity-15"
          style={{ background: "linear-gradient(to left, rgba(42, 157, 143, 0.7), transparent)" }}
        />
      </div>
    </div>
  );
}
