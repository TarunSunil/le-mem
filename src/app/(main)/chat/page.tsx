"use client";

import { ChatInput } from "@/components/chat/ChatInput";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { useSession } from "next-auth/react";
import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  contexts?: string[];
}

export default function ChatPage() {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const storageKeyRef = useRef<string | null>(null);

  useEffect(() => {
    // Only clear stored messages when the user is definitively signed out.
    if (status === "unauthenticated") {
      if (storageKeyRef.current) {
        sessionStorage.removeItem(storageKeyRef.current);
      }

      storageKeyRef.current = null;
      setMessages([]);
      return;
    }

    // If authenticated and we have an email, load stored messages.
    if (status === "authenticated" && session?.user?.email) {
      const storageKey = `le-mem:chat-history:${session.user.email}`;
      storageKeyRef.current = storageKey;

      try {
        const storedMessages = sessionStorage.getItem(storageKey);
        setMessages(storedMessages ? (JSON.parse(storedMessages) as Message[]) : []);
      } catch {
        sessionStorage.removeItem(storageKey);
        setMessages([]);
      }
    }
  }, [session?.user?.email, status]);

  useEffect(() => {
    if (!storageKeyRef.current) {
      return;
    }

    sessionStorage.setItem(storageKeyRef.current, JSON.stringify(messages));
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    if (status !== "authenticated" || !session?.user?.email) {
      setError("Please sign in to send messages and save memories.");
      return;
    }

    // Add user message
    const userMessage: Message = { role: "user", content };
    setMessages((prev) => [...prev, userMessage]);
    setError(null);
    setIsLoading(true);

    try {
      const memoryResponse = await fetch("/api/memory/ingest", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          contentType: "CONTEXT_UPDATE",
        }),
      });

      if (!memoryResponse.ok) {
        let errorMessage = `Failed to save memory (${memoryResponse.status})`;

        try {
          const contentType = memoryResponse.headers.get("content-type") ?? "";
          if (contentType.includes("application/json")) {
            const errorBody = await memoryResponse.json();
            if (errorBody?.error) {
              errorMessage = errorBody.error;
            }
          } else {
            const errorText = await memoryResponse.text();
            if (errorText.trim()) {
              errorMessage = errorText;
            }
          }
        } catch {
          // Keep the status-based fallback when error parsing fails.
        }

        throw new Error(errorMessage);
      }

      // Call the chat API with streaming
      const response = await fetch("/api/chat", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        let errorMessage = `Failed to send message (${response.status})`;

        try {
          const contentType = response.headers.get("content-type") ?? "";
          if (contentType.includes("application/json")) {
            const errorBody = await response.json();
            if (errorBody?.error) {
              errorMessage = errorBody.error;
            }
          } else {
            const errorText = await response.text();
            if (errorText.trim()) {
              errorMessage = errorText;
            }
          }
        } catch {
          // Keep status-based fallback when error parsing fails.
        }

        throw new Error(errorMessage);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      let assistantMessage = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        assistantMessage += chunk;

        // Update the assistant message in real-time.
        // If the last message is already an assistant message, update its content,
        // otherwise push a new assistant message once.
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === "assistant") {
            last.content = assistantMessage;
          } else {
            updated.push({ role: "assistant", content: assistantMessage });
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
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-container-padding pt-6 pb-36 md:pb-28">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
          <section className="glass-panel border border-white/10 p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-secondary-container px-3 py-1 text-label-sm text-on-secondary-container">
                FYI Memory Chat
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1 text-label-sm text-on-surface-variant">
                Private context stream
              </span>
            </div>

            <div className="mt-5 max-w-2xl">
              <h1
                className="font-newsreader text-3xl leading-tight md:text-5xl"
                style={{ color: "var(--fyi-text)" }}
              >
                Capture your memory stream in one quiet place.
              </h1>
              <p className="mt-4 text-body-md md:text-body-lg" style={{ color: "var(--fyi-muted)" }}>
                Drop notes, projects, and reflections here. FYI will connect the dots and build context pages as you go.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            {messages.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 md:p-8">
                <p className="text-body-lg" style={{ color: "var(--fyi-text)" }}>
                  Start a new memory thread.
                </p>
                <p className="mt-2 max-w-2xl text-body-md leading-7" style={{ color: "var(--fyi-muted)" }}>
                  Ask about an internship, paste a note, or describe a project and FYI will keep the context ready.
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <MessageBubble
                  key={`${message.role}-${index}`}
                  role={message.role}
                  content={message.content}
                  contexts={message.contexts}
                />
              ))
            )}
            {error && (
              <div
                className="rounded-lg border border-red-500 bg-red-500/10 p-4"
                style={{ color: "#ff6b6b" }}
              >
                Error: {error}
              </div>
            )}
          </section>

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="input-gradient sticky bottom-0 mt-auto border-t border-white/5 px-container-padding pb-4 pt-5 md:pb-6">
        <div className="mx-auto w-full max-w-4xl">
          <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
