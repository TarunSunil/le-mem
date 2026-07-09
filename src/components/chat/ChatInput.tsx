"use client";

import { useEffect, useRef, useState } from "react";
import { isQuestionLike } from "@/lib/memoryHelpers";

export type ChatMode = "store" | "ask" | "agent";
interface ChatInputProps {
  onSend: (message: string, mode: ChatMode) => void;
  isLoading?: boolean;
  initialMessage?: string;
}

export function ChatInput({ onSend, isLoading = false, initialMessage = "" }: ChatInputProps) {
  const [message, setMessage] = useState(initialMessage);
  const [mode, setMode] = useState<ChatMode>("store");
  const [isPending, setIsPending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const lastInputAtRef = useRef<number>(Date.now());
  const pendingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  }, [message]);

  useEffect(() => () => {
    if (pendingTimeoutRef.current) {
      window.clearTimeout(pendingTimeoutRef.current);
    }
  }, []);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!message.trim() || isLoading || isPending) return;

    const nextMessage = message;
    const nextMode = effectiveMode;

    const delay =
      nextMode === "store"
        ? Math.max(0, 1500 - (Date.now() - lastInputAtRef.current))
        : 0;

    if (delay > 0) {
      setIsPending(true);
      pendingTimeoutRef.current = window.setTimeout(() => {
        onSend(nextMessage, nextMode);
        setIsPending(false);
        pendingTimeoutRef.current = null;
      }, delay);
    } else {
      onSend(nextMessage, nextMode);
    }

    setMessage("");
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.ctrlKey && !isLoading && !isPending) {
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const isQuestion = Boolean(message.trim()) && isQuestionLike(message);
  const effectiveMode: ChatMode = mode === "agent" ? "agent" : isQuestion ? "ask" : mode;
  const isAsk = effectiveMode === "ask";

  return (
    <form onSubmit={handleSubmit} className="fyi-input-panel px-3 py-3 md:px-4 md:py-4">
      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        <div
          className="flex items-center rounded-full border border-white/10 bg-white/5 p-1"
          role="tablist"
          aria-label="Chat mode"
        >
          <button
            type="button"
            onClick={() => setMode("store")}
            className={
              "flex items-center gap-1 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.2em] transition-colors md:text-label-sm md:tracking-normal " +
              (effectiveMode === "store" ? "bg-white/10" : "opacity-70 hover:opacity-100")
            }
            aria-pressed={effectiveMode === "store"}
            aria-label="Switch to Store mode — statements will be saved"
            style={{ color: "var(--fyi-accent)" }}
          >
            <span className="material-symbols-outlined text-base">save</span>
            Store
          </button>
          <button
            type="button"
            onClick={() => setMode("ask")}
            className={
              "flex items-center gap-1 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.2em] transition-colors md:text-label-sm md:tracking-normal " +
              (effectiveMode === "ask" ? "bg-white/10" : "opacity-70 hover:opacity-100")
            }
            aria-pressed={effectiveMode === "ask"}
            aria-label="Switch to Ask mode — questions will not be stored"
            style={{ color: "var(--fyi-accent-2)" }}
          >
            <span className="material-symbols-outlined text-base">manage_search</span>
            Ask
          </button>
          <button
            type="button"
            onClick={() => setMode("agent")}
            className={
              "flex items-center gap-1 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.2em] transition-colors md:text-label-sm md:tracking-normal " +
              (effectiveMode === "agent" ? "bg-white/10" : "opacity-70 hover:opacity-100")
            }
            aria-pressed={effectiveMode === "agent"}
            style={{ color: "var(--fyi-highlight)" }}
          >
            <span className="material-symbols-outlined text-base">psychology</span>
            Agent
          </button>
        </div>

        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => {
            lastInputAtRef.current = Date.now();
            setMessage(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={isLoading || isPending}
          placeholder={
            isAsk
              ? "Ask anything about your memories..."
              : "Describe a memory, paste a note, add a fact..."
          }
          className="max-h-36 w-full flex-1 resize-none bg-transparent text-sm leading-6 outline-none placeholder:text-on-surface-variant disabled:opacity-50 md:max-h-40 md:text-body-md md:leading-7"
          aria-label="Memory input"
        />

        <button
          type="submit"
          disabled={!message.trim() || isLoading || isPending}
          aria-label="Send message"
          className="flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 md:h-11 md:w-11"
          style={
            isAsk
              ? {
                  backgroundColor: "var(--fyi-accent-2-strong)",
                  color: "var(--fyi-accent-2-soft)",
                }
              : {
                  backgroundColor: "var(--fyi-accent-strong)",
                  color: "var(--fyi-accent-soft)",
                }
          }
        >
          <span className="material-symbols-outlined text-lg md:text-xl">
            {isLoading || isPending ? "hourglass_empty" : "send"}
          </span>
        </button>
      </div>

      <span className="sr-only" aria-live="polite">
        {isLoading || isPending
          ? "Processing"
          : `${effectiveMode === "agent" ? "Agent" : effectiveMode === "ask" ? "Ask" : "Store"} mode ready`}
      </span>
    </form>
  );
}
