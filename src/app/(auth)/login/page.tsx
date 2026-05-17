// src/app/(auth)/login/page.tsx

"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "var(--fyi-bg)" }}>
      <div className="w-full max-w-md p-8 rounded-2xl border" style={{backgroundColor: "var(--fyi-surface)", borderColor: "var(--fyi-border)"}}>
        <h1 className="text-headline-lg font-newsreader mb-2 text-center" style={{color: "var(--fyi-text)"}}>
          FYI
        </h1>
        <p className="text-center mb-8" style={{color: "var(--fyi-muted)"}}>
          Personal Memory OS
        </p>

        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/chat" })}
          className="w-full py-3 px-4 rounded-lg font-medium transition-all"
          style={{backgroundColor: "var(--fyi-accent)", color: "var(--fyi-accent-contrast)"}}
        >
          Sign in with Google
        </button>

      </div>
    </div>
  );
}
