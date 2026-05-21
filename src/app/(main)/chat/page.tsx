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
            </div>
          </section>

          <section className="space-y-3">
            {messages.length > 0 && messages.map((message, index) => (
              <MessageBubble
                key={`${message.role}-${index}`}
                role={message.role}
                content={message.content}
                contexts={message.contexts}
              />
            ))}
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

      <div className="input-gradient mt-auto border-t border-white/5 px-4 pb-3 pt-4 md:px-container-padding md:pb-6 md:pt-5">
        <div className="mx-auto w-full max-w-4xl">
          <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
