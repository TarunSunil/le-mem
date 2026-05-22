"use client";

import { ChatInput, type ChatMode } from "@/components/chat/ChatInput";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { useSession } from "next-auth/react";
import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  contexts?: string[];
  mode?: ChatMode;
}

export default function ChatPage() {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const storageKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      if (storageKeyRef.current) sessionStorage.removeItem(storageKeyRef.current);
      storageKeyRef.current = null;
      setMessages([]);
      return;
    }

    if (status === "authenticated" && session?.user?.email) {
      const key = `le-mem:chat-history:${session.user.email}`;
      storageKeyRef.current = key;
      try {
        const stored = sessionStorage.getItem(key);
        setMessages(stored ? (JSON.parse(stored) as Message[]) : []);
      } catch {
        sessionStorage.removeItem(key);
        setMessages([]);
      }
    }
  }, [session?.user?.email, status]);

  useEffect(() => {
    if (!storageKeyRef.current) return;
    sessionStorage.setItem(storageKeyRef.current, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (content: string, mode: ChatMode) => {
    if (!content.trim()) return;

    if (status !== "authenticated" || !session?.user?.email) {
      setError("Please sign in to send messages.");
      return;
    }

    const userMessage: Message = { role: "user", content, mode };
    setMessages((prev) => [...prev, userMessage]);
    setError(null);
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
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantContent += new TextDecoder().decode(value);

        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === "assistant") {
            last.content = assistantContent;
          } else {
            updated.push({ role: "assistant", content: assistantContent });
          }
          return updated;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Chat error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100dvh-4.25rem)] flex-col">
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

      <div className="flex-1 overflow-y-auto px-4 pt-10 pb-24 md:px-container-padding md:pt-8 md:pb-28">
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
            {messages.map((message, index) => (
              <MessageBubble
                key={`${message.role}-${index}`}
                role={message.role}
                content={message.content}
                contexts={message.contexts}
                mode={message.mode}
              />
            ))}

            {error && (
              <div
                className="rounded-lg border border-red-500 bg-red-500/10 p-4 text-sm"
                style={{ color: "#ff6b6b" }}
              >
                Error: {error}
              </div>
            )}
          </section>

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="input-gradient mt-auto border-t border-white/5 px-4 pb-3 pt-4 md:px-container-padding md:pb-6 md:pt-5">
        <div className="mx-auto w-full max-w-4xl">
          <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}