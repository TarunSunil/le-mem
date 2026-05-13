// src/app/(main)/layout.tsx

import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { TopBar } from "@/components/layout/TopBar";
import { authOptions } from "@/auth";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-[#131313]">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile TopBar */}
      <TopBar />

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pt-14 md:pt-0 pb-20 md:pb-0 overflow-y-auto">
        <div className="w-full h-full">{children}</div>
      </main>

      {/* Mobile Bottom Nav */}
      <BottomNav />

      {/* Ambient Orbs Background */}
      <div className="fixed -z-10 inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 blur-3xl opacity-20" style={{background: "linear-gradient(to right, #3131c0, transparent)"}} />
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 blur-3xl opacity-15" style={{background: "linear-gradient(to left, #ddb7ff, transparent)"}} />
      </div>
    </div>
  );
}
