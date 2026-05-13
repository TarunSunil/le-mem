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
    <form onSubmit={handleSubmit} className="glass-panel border border-white/10 p-3 md:p-4">
      <div className="flex items-end gap-3">
        <button
          type="button"
          disabled={isLoading}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-on-surface-variant transition-colors hover:bg-white/10 hover:text-on-surface disabled:opacity-50"
          aria-label="Attach file"
        >
          <span className="material-symbols-outlined text-xl">attach_file</span>
        </button>

        <div className="flex-1 rounded-3xl border border-white/10 bg-black/20 px-4 py-3">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isLoading}
            placeholder="Describe a memory, paste a note, or ask a question..."
            className="max-h-44 w-full resize-none bg-transparent text-body-md leading-7 outline-none placeholder:text-on-surface-variant disabled:opacity-50"
          />

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-label-sm text-on-surface-variant">
              <span
                className="inline-flex h-2 w-2 rounded-full"
                style={{
                  backgroundColor: isLoading ? "#b0b2ff" : "#c6e8c9",
                }}
              />
              {isLoading ? "Processing..." : "Extracting entities automatically"}
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

        <button
          type="button"
          disabled={isLoading}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-on-surface-variant transition-colors hover:bg-white/10 hover:text-on-surface disabled:opacity-50"
          aria-label="Voice input"
        >
          <span className="material-symbols-outlined text-xl">mic</span>
        </button>
      </div>
    </form>
  );
}