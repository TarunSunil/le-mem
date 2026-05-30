// src/app/(auth)/login/page.tsx

"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden" style={{ backgroundColor: "var(--fyi-bg)" }}>
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute left-[10%] top-[10%] h-72 w-72 rounded-full blur-[120px] opacity-40"
          style={{ background: "radial-gradient(circle, rgba(224, 122, 95, 0.6), transparent 60%)" }}
        />
        <div
          className="absolute right-[10%] bottom-[15%] h-80 w-80 rounded-full blur-[120px] opacity-30"
          style={{ background: "radial-gradient(circle, rgba(42, 157, 143, 0.6), transparent 60%)" }}
        />
      </div>

      <div className="mx-auto grid w-full max-w-5xl gap-8 px-6 py-12 md:grid-cols-2">
        <div className="flex flex-col justify-center">
          <p className="text-[11px] uppercase tracking-[0.4em]" style={{ color: "var(--fyi-accent)" }}>
            FYI Personal Memory OS
          </p>
          <h1 className="mt-4 font-newsreader text-3xl leading-tight md:text-5xl" style={{ color: "var(--fyi-text)" }}>
            A calm home for everything you learn, remember, and want to follow.
          </h1>
          <p className="mt-4 text-sm leading-6 md:text-body-md" style={{ color: "var(--fyi-muted)" }}>
            Capture moments, watch them connect, and ask questions without losing your private context.
          </p>
          <div className="mt-6 grid gap-3">
            {[
              "Capture memories in a single stream",
              "Surface people, projects, and topics on demand",
              "Stay in control with zero-share defaults",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="material-symbols-outlined text-lg" style={{ color: "var(--fyi-accent)" }}>
                  auto_awesome
                </span>
                <span className="text-sm" style={{ color: "var(--fyi-text)" }}>
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
            <h2 className="text-xl font-newsreader" style={{ color: "var(--fyi-text)" }}>
              Welcome back
            </h2>
            <p className="mt-2 text-sm" style={{ color: "var(--fyi-muted)" }}>
              Sign in to continue your memory timeline.
            </p>

            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/chat" })}
              className="mt-6 w-full rounded-2xl px-4 py-3 text-sm font-medium transition-all hover:opacity-90"
              style={{ backgroundColor: "var(--fyi-accent)", color: "var(--fyi-accent-contrast)" }}
            >
              Sign in with Google
            </button>

            <p className="mt-4 text-[11px] uppercase tracking-[0.22em]" style={{ color: "var(--fyi-muted)" }}>
              Private by default
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
