// src/components/layout/TopBar.tsx
"use client";

export function TopBar() {
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-50 flex h-14 items-center border-b px-4 pt-[env(safe-area-inset-top)]" style={{backgroundColor: "var(--fyi-bg)", borderColor: "var(--fyi-border)"}}>
      <h1 className="text-headline-md font-newsreader" style={{color: "var(--fyi-text)"}}>
        FYI
      </h1>
    </header>
  );
}
