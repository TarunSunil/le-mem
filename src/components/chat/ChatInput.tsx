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
    <form onSubmit={handleSubmit} className="fyi-input-panel px-3 py-3 md:px-4 md:py-4">
      <div className="flex items-center gap-2 md:gap-3">
        <span
          className="material-symbols-outlined text-lg md:text-xl"
          style={{ color: "var(--fyi-muted)" }}
        >
          storage
        </span>
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={isLoading}
          placeholder="Describe a memory, paste a note, or ask FYI..."
          className="max-h-36 w-full flex-1 resize-none bg-transparent text-sm leading-6 outline-none placeholder:text-on-surface-variant disabled:opacity-50 md:max-h-40 md:text-body-md md:leading-7"
        />
        <button
          type="submit"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 md:h-11 md:w-11"
          disabled={!message.trim() || isLoading}
          aria-label="Send message"
        >
          <span className="material-symbols-outlined text-lg md:text-xl">
            {isLoading ? "hourglass_empty" : "send"}
          </span>
        </button>
      </div>
      <span className="sr-only" aria-live="polite">
        {isLoading ? "Processing" : "Ready"}
      </span>
    </form>
  );
}