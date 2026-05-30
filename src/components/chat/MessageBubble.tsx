"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import type { ChatMode } from "@/components/chat/ChatInput";

type MessageBubbleProps = {
  role: "user" | "assistant";
  content: string;
  contexts?: string[];
  mode?: ChatMode;
  createdAt?: number;
};

export function MessageBubble({ role, content, contexts, mode, createdAt }: MessageBubbleProps) {
  const isUser = role === "user";
  const isAsk = mode === "ask";
  const [copied, setCopied] = useState(false);
  const timestamp = typeof createdAt === "number" ? new Date(createdAt) : null;
  const timeLabel = timestamp
    ? timestamp.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <article
      className={cn(
        "group max-w-[88%] rounded-2xl px-4 py-3 md:max-w-[72%] md:rounded-3xl md:px-5 md:py-4",
        isUser ? "ml-auto bubble-user" : "bubble-ai"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] md:text-label-sm md:tracking-normal"
            style={{
              color: isUser
                ? isAsk
                  ? "var(--fyi-accent-2)"
                  : "var(--fyi-accent)"
                : "var(--fyi-muted)",
            }}
          >
            <span className="material-symbols-outlined text-sm md:text-base">
              {isUser ? (isAsk ? "manage_search" : "save") : "auto_awesome"}
            </span>
            {isUser ? (isAsk ? "Ask" : "Store") : "FYI"}
          </div>

          {isUser && mode && (
            <span
              className="rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em]"
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
              {isAsk ? "not stored" : "stored"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {timeLabel && (
            <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: "var(--fyi-muted)" }}>
              {timeLabel}
            </span>
          )}
          {!isUser && (
            <button
              type="button"
              onClick={handleCopy}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[10px] uppercase tracking-[0.2em] opacity-0 transition group-hover:opacity-100"
              style={{ color: "var(--fyi-muted)" }}
              aria-label={copied ? "Copied" : "Copy message"}
            >
              <span className="material-symbols-outlined text-sm">
                {copied ? "check" : "content_copy"}
              </span>
            </button>
          )}
        </div>
      </div>

      <div
        className="mt-2 fyi-markdown text-sm leading-6 md:mt-3 md:text-base md:leading-7"
        style={{ color: "#e5e2e1" }}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
          {content}
        </ReactMarkdown>
      </div>

      {contexts && contexts.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {contexts.map((context) => (
            <span key={context} className="context-chip text-label-sm">
              {context}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}