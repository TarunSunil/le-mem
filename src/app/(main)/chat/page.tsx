"use client";

import { ChatInput } from "@/components/chat/ChatInput";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { SuggestionChips } from "@/components/chat/SuggestionChips";
import { TARUN_CHAT_SEED } from "@/lib/context-registry";
import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  contexts?: string[];
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(TARUN_CHAT_SEED);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage: Message = { role: "user", content };
    setMessages((prev) => [...prev, userMessage]);
    setError(null);
    setIsLoading(true);

    try {
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

        // Update the assistant message in real-time
        setMessages((prev) => {
          const updated = [...prev];
          if (
            updated[updated.length - 1]?.role === "assistant" &&
            updated[updated.length - 1]?.content === assistantMessage.slice(0, -chunk.length)
          ) {
            updated[updated.length - 1].content = assistantMessage;
          } else {
            updated.push({
              role: "assistant",
              content: assistantMessage,
            });
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
                Omni-Chat
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1 text-label-sm text-on-surface-variant">
                Memory extraction on
              </span>
            </div>

            <div className="mt-5 max-w-2xl">
              <h1
                className="font-newsreader text-3xl leading-tight md:text-5xl"
                style={{ color: "#e5e2e1" }}
              >
                Talk to your memory like a private chat.
              </h1>
              <p className="mt-4 text-body-md md:text-body-lg" style={{ color: "#c5c7c9" }}>
                Dump ideas, images, places, and people. Le Mem will extract the entities, connect the dots, and keep the context ready when you need it.
              </p>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {[
                ["142", "memories captured"],
                ["18", "linked contexts"],
                ["64%", "retrieval confidence"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-2xl font-semibold" style={{ color: "#e5e2e1" }}>
                    {value}
                  </div>
                  <div className="mt-1 text-label-sm" style={{ color: "#c5c7c9" }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <SuggestionChips onSuggest={handleSendMessage} />

          <section className="space-y-3">
            {messages.map((message, index) => (
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

      <div className="input-gradient sticky bottom-0 mt-auto border-t border-white/5 px-container-padding pb-4 pt-5 md:pb-6">
        <div className="mx-auto w-full max-w-4xl">
          <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
