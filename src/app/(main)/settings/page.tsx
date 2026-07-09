import Link from "next/link";
import { getCachedSession } from "@/lib/auth/get-session";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import { SettingsActions } from "@/components/settings/SettingsActions";

export default async function SettingsPage() {
  const session = await getCachedSession();
  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { email: true } });
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-full flex-col px-4 py-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:px-container-padding md:py-6">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <section className="glass-panel border border-white/10 p-5 md:p-8">
          <h1 className="font-newsreader text-2xl md:text-5xl" style={{ color: "var(--fyi-text)" }}>
            Privacy and account controls.
          </h1>
          <p className="mt-3 text-sm leading-6" style={{ color: "var(--fyi-muted)" }}>
            Export your data before deleting it. Deletion is permanent and removes your memories, entities, relations, suggestions, and traces.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link href="/api/account/export" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 transition-colors hover:bg-white/10" style={{ color: "var(--fyi-text)" }}>
              Download export JSON
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 md:p-8">
          <h2 className="text-lg font-semibold" style={{ color: "var(--fyi-text)" }}>
            Delete account and data
          </h2>
          <p className="mt-2 text-sm leading-6" style={{ color: "var(--fyi-muted)" }}>
            Type your email exactly to enable deletion.
          </p>
          <SettingsActions email={user.email} />
        </section>
      </div>
    </div>
  );
}