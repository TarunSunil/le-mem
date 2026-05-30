"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

export type ToastVariant = "success" | "error" | "info";

type Toast = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  addToast: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function getToastStyle(variant: ToastVariant) {
  switch (variant) {
    case "success":
      return "border-emerald-400/40 bg-emerald-500/10 text-emerald-200";
    case "error":
      return "border-red-400/40 bg-red-500/10 text-red-200";
    default:
      return "border-white/10 bg-white/5 text-on-surface-variant";
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const touchStartX = useRef<number | null>(null);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, variant }]);

    window.setTimeout(() => {
      removeToast(id);
    }, 3000);
  }, [removeToast]);

  const contextValue = useMemo(() => ({ addToast }), [addToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div
        className="pointer-events-none fixed bottom-5 right-4 z-50 flex w-[min(360px,90vw)] flex-col gap-2"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-2xl border px-4 py-3 text-sm shadow-lg backdrop-blur ${getToastStyle(toast.variant)}`}
            role="status"
            onClick={() => removeToast(toast.id)}
            onTouchStart={(event) => {
              touchStartX.current = event.changedTouches[0]?.clientX ?? null;
            }}
            onTouchEnd={(event) => {
              const startX = touchStartX.current;
              const endX = event.changedTouches[0]?.clientX ?? null;
              if (startX != null && endX != null && Math.abs(endX - startX) > 50) {
                removeToast(toast.id);
              }
              touchStartX.current = null;
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
