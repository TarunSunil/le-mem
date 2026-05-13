// src/app/(auth)/login/page.tsx

"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#131313]">
      <div className="w-full max-w-md p-8 rounded-2xl border" style={{backgroundColor: "#131313", borderColor: "#44474a"}}>
        <h1 className="text-headline-lg font-newsreader mb-2 text-center" style={{color: "#e5e2e1"}}>
          Le Mem
        </h1>
        <p className="text-center mb-8" style={{color: "#c5c7c9"}}>
          Personal Memory OS
        </p>

        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/chat" })}
          className="w-full py-3 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity"
          style={{backgroundColor: "#3131c0", color: "#b0b2ff"}}
        >
          Sign in with Google
        </button>

        <p className="text-center text-label-sm mt-8" style={{color: "#c5c7c9"}}>
          Coming soon...
        </p>
      </div>
    </div>
  );
}
