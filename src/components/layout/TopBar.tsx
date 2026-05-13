// src/components/layout/TopBar.tsx
"use client";

export function TopBar() {
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 h-14 border-b flex items-center px-4 z-50" style={{backgroundColor: "#131313", borderColor: "#44474a"}}>
      <h1 className="text-headline-md font-newsreader" style={{color: "#e5e2e1"}}>
        Le Mem
      </h1>
    </header>
  );
}
