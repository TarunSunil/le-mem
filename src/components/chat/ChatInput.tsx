"use client";

import { useEffect, useRef, useState } from "react";
import { isQuestionLike } from "@/lib/memoryHelpers";

export type ChatMode = "store" | "ask";

interface ChatInputProps {
  onSend: (message: string, mode: ChatMode) => void;
  isLoading?: boolean;
  initialMessage?: string;
}

export function ChatInput({ onSend, isLoading = false, initialMessage = "" }: ChatInputProps) {
  const [message, setMessage] = useState(initialMessage);
  const [mode, setMode] = useState<ChatMode>("store");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  }, [message]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!message.trim() || isLoading) return;
    onSend(message, detectedMode);
    setMessage("");
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.ctrlKey && !isLoading) {
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const detectedMode: ChatMode = message.trim() && isQuestionLike(message) ? "ask" : mode;
  const isAsk = detectedMode === "ask";

  return (
    <form onSubmit={handleSubmit} className="fyi-input-panel px-3 py-3 md:px-4 md:py-4">
      <div className="flex items-center gap-2 md:gap-3">
        <button
          type="button"
          onClick={() => setMode(isAsk ? "store" : "ask")}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-colors md:h-10 md:w-10"
          style={{
            backgroundColor: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: isAsk ? "var(--fyi-accent-2)" : "var(--fyi-accent)",
          }}
          aria-label={isAsk ? "Switch to store mode" : "Switch to ask mode"}
        >
          <span className="material-symbols-outlined text-lg md:text-xl">
            {isAsk ? "manage_search" : "save"}
          </span>
        </button>

        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={isLoading}
          placeholder={
            isAsk
              ? "Ask anything about your memories..."
              : "Describe a memory, paste a note, add a fact..."
          }
          className="max-h-36 w-full flex-1 resize-none bg-transparent text-sm leading-6 outline-none placeholder:text-on-surface-variant disabled:opacity-50 md:max-h-40 md:text-body-md md:leading-7"
        />

        <button
          type="submit"
          disabled={!message.trim() || isLoading}
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
            {isLoading ? "hourglass_empty" : "send"}
          </span>
        </button>
      </div>

      <span className="sr-only" aria-live="polite">
        {isLoading ? "Processing" : `${detectedMode === "ask" ? "Ask" : "Store"} mode ready`}
      </span>
    </form>
  );
}
