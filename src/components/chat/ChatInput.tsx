"use client";

import { useEffect, useRef, useState } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
}

export function ChatInput({ onSend, isLoading = false }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  }, [message]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim() || isLoading) {
      return;
    }

    onSend(message);
    setMessage("");
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.ctrlKey && !isLoading) {
      handleSubmit(e as any);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="fyi-input-panel">
      <div className="flex items-end gap-3">
        <div className="flex-1 rounded-3xl border border-white/10 bg-black/20 px-4 py-3">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isLoading}
            placeholder="Describe a memory, paste a note, or ask FYI..."
            className="max-h-44 w-full resize-none bg-transparent text-body-md leading-7 outline-none placeholder:text-on-surface-variant disabled:opacity-50"
          />

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-label-sm text-on-surface-variant">
              {isLoading ? "Processing..." : "Ready"}
            </div>

            <button
              type="submit"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              disabled={!message.trim() || isLoading}
              aria-label="Send message"
            >
              <span className="material-symbols-outlined text-xl">
                {isLoading ? "hourglass_empty" : "send"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}