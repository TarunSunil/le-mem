"use client";

import { ChatInput, type ChatMode } from "@/components/chat/ChatInput";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/components/ui/Toast";
import { AgentSuggestions } from "@/components/chat/AgentSuggestions";

interface Message {
  role: "user" | "assistant";
  content: string;
  contexts?: string[];
  mode?: ChatMode;
  createdAt?: number;
  trace?: Array<{ type: string; toolName?: string; content: string }>;
}
const HISTORY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_STORED_MESSAGES = 100;


export default function ChatPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const prefill = searchParams.get("prefill") ?? "";
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const storageKeyRef = useRef<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (status === "unauthenticated") {
      if (storageKeyRef.current) sessionStorage.removeItem(storageKeyRef.current);
      storageKeyRef.current = null;
      queueMicrotask(() => setMessages([]));
      return;
    }

    if (status === "authenticated" && session?.user?.email) {
      const key = `le-mem:chat-history:${session.user.email}`;
      storageKeyRef.current = key;
      try {
        const stored = sessionStorage.getItem(key);
        const parsed = stored ? JSON.parse(stored) : null;
        if (Array.isArray(parsed)) {
          queueMicrotask(() => setMessages(parsed));
          return;
        }

        const payload = parsed as { messages?: Message[]; ts?: number } | null;
        if (!payload?.messages || !payload.ts) {
          queueMicrotask(() => setMessages([]));
          return;
        }

        if (Date.now() - payload.ts > HISTORY_TTL_MS) {
          sessionStorage.removeItem(key);
          queueMicrotask(() => setMessages([]));
          return;
        }

        queueMicrotask(() => setMessages(payload.messages ?? []));
      } catch {
        sessionStorage.removeItem(key);
        queueMicrotask(() => setMessages([]));
      }
    }
  }, [session?.user?.email, status]);

  useEffect(() => {
    if (!storageKeyRef.current) return;
    sessionStorage.setItem(
      storageKeyRef.current,
      JSON.stringify({
        ts: Date.now(),
        messages: messages.slice(-MAX_STORED_MESSAGES),
      })
    );
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (content: string, mode: ChatMode) => {
    if (!content.trim()) return;

    if (status !== "authenticated" || !session?.user?.email) {
      addToast("Please sign in to send messages.", "error");
      return;
    }

    const userMessage: Message = { role: "user", content, mode, createdAt: Date.now() };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      if (mode === "store") {
        const memRes = await fetch("/api/memory/ingest", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, contentType: "CONTEXT_UPDATE" }),
        });

        if (!memRes.ok) {
          let errMsg = `Failed to save memory (${memRes.status})`;
          try {
            const ct = memRes.headers.get("content-type") ?? "";
            if (ct.includes("application/json")) {
              const body = await memRes.json();
              if (body?.error) errMsg = body.error;
            } else {
              const txt = await memRes.text();
              if (txt.trim()) errMsg = txt;
            }
          } catch {
            // Keep fallback.
          }
          throw new Error(errMsg);
        }

        const memoryBody = await memRes.json();
        addToast(
          memoryBody?.skipped ? "No durable memory saved" : "Memory saved",
          memoryBody?.skipped ? "info" : "success"
        );
      }

      const chatRes = await fetch("/api/chat", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          mode,
        }),
      });

      if (!chatRes.ok) {
        let errMsg = `Failed to send message (${chatRes.status})`;
        try {
          const ct = chatRes.headers.get("content-type") ?? "";
          if (ct.includes("application/json")) {
            const body = await chatRes.json();
            if (body?.error) errMsg = body.error;
          } else {
            const txt = await chatRes.text();
            if (txt.trim()) errMsg = txt;
          }
        } catch {
          // Keep fallback.
        }
        throw new Error(errMsg);
      }

      const reader = chatRes.body?.getReader();
      if (!reader) throw new Error("No response body");

      let assistantContent = "";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "",
          createdAt: Date.now(),
        },
      ]);
      const traceSteps: Array<{ type: string; toolName?: string; content: string }> = [];

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += new TextDecoder().decode(value);
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("__trace__:")) {
            try {
              const step = JSON.parse(line.slice("__trace__:".length));
              traceSteps.push(step);
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === "assistant") {
                  (last as Message & { trace?: typeof traceSteps }).trace = [...traceSteps];
                } else {
                  updated.push({ role: "assistant", content: "", trace: [...traceSteps], createdAt: Date.now() });
                }
                return updated;
              });
            } catch { /* ignore malformed trace */ }
          } else if (line.trim()) {
            assistantContent += line;
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last?.role === "assistant") {
                last.content = assistantContent;
              } else {
                updated.push({ role: "assistant", content: assistantContent, createdAt: Date.now() });
              }
              return updated;
            });
          }
        }
      }

      // Flush remaining buffer after stream ends
      if (buffer.trim()) {
        if (buffer.startsWith("__trace__:")) {
          try {
            const step = JSON.parse(buffer.slice("__trace__:".length));
            traceSteps.push(step);
          } catch { /* ignore */ }
        } else {
          assistantContent += buffer;
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.role === "assistant") {
              last.content = assistantContent;
            } else {
              updated.push({
                role: "assistant",
                content: assistantContent,
                createdAt: Date.now(),
              });
            }
            return updated;
          });
        }
      }
    } catch (err) {
      addToast(err instanceof Error ? err.message : "An error occurred", "error");
      console.error("Chat error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100dvh-4.25rem-env(safe-area-inset-bottom))] flex-col">
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-40 border-b"
        style={{ backgroundColor: "var(--fyi-bg)", borderColor: "var(--fyi-border)" }}
      >
        <div className="px-4 py-2">
          <span
            className="font-newsreader text-label-sm uppercase tracking-[0.4em]"
            style={{ color: "var(--fyi-highlight)" }}
          >
            FYI
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-3 pt-10 pb-24 md:px-container-padding md:pt-8 md:pb-28">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 md:gap-6">
          <section className="glass-panel rounded-2xl border border-white/10 px-4 py-4 md:rounded-3xl md:px-8 md:py-6">
            <div className="max-w-2xl">
              <h1
                className="font-newsreader text-2xl leading-tight md:text-5xl"
                style={{ color: "var(--fyi-highlight)" }}
              >
                Capture your memory stream in one quiet place.
              </h1>
              <p
                className="mt-2 text-xs leading-5 md:mt-3 md:text-body-md"
                style={{ color: "var(--fyi-muted)" }}
              >
                Use <strong style={{ color: "var(--fyi-accent-soft)" }}>Store</strong> to save
                memories. Use <strong style={{ color: "var(--fyi-accent-2-soft)" }}>Ask</strong> to
                query them. Your questions are never stored.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            {/* Agent suggestion cards */}
            <AgentSuggestions />
            {messages.map((message, index) => (
              <MessageBubble
                key={`${message.role}-${index}`}
                role={message.role}
                content={message.content}
                contexts={message.contexts}
                mode={message.mode}
                createdAt={message.createdAt}
                trace={message.trace}
              />
            ))}
          </section>

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="input-gradient mt-auto border-t border-white/5 px-3 pb-3 pt-3 md:px-container-padding md:pb-6 md:pt-5">
        <div className="mx-auto w-full max-w-4xl">
          <ChatInput onSend={handleSendMessage} isLoading={isLoading} initialMessage={prefill} />
        </div>
      </div>
    </div>
  );
}
