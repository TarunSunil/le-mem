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
  trace?: Array<{ type: string; toolName?: string; content: string }>;
};

export function MessageBubble({ role, content, contexts, mode, createdAt, trace }: MessageBubbleProps) {
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
      <div className="flex flex-wrap items-start justify-between gap-2">
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
      {!isUser && trace && trace.length > 0 && (
        <details className="mt-3 rounded-2xl border border-white/10 bg-black/20">
          <summary
            className="cursor-pointer px-4 py-2 text-[11px] uppercase tracking-[0.2em] select-none"
            style={{ color: "var(--fyi-accent)" }}
          >
            {trace.length} reasoning step{trace.length !== 1 ? "s" : ""}
          </summary>
          <div className="space-y-2 px-4 pb-4 pt-2">
            {trace.map((step, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-sm" style={{ color: "var(--fyi-highlight)" }}>
                    {step.type === "tool_call" ? "build" : step.type === "tool_result" ? "check_circle" : "psychology"}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: "var(--fyi-muted)" }}>
                    {step.toolName ? `${step.type} · ${step.toolName}` : step.type}
                  </span>
                </div>
                <pre className="text-[11px] leading-5 whitespace-pre-wrap break-words" style={{ color: "var(--fyi-muted)" }}>
                  {step.content.slice(0, 400)}{step.content.length > 400 ? "…" : ""}
                </pre>
              </div>
            ))}
          </div>
        </details>
      )}

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