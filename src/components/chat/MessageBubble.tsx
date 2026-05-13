import { cn } from "@/lib/utils";

type MessageBubbleProps = {
  role: "user" | "assistant";
  content: string;
  contexts?: string[];
};

export function MessageBubble({ role, content, contexts }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <article
      className={cn(
        "max-w-[88%] rounded-3xl px-5 py-4 md:max-w-[72%]",
        isUser ? "ml-auto bubble-user" : "bubble-ai"
      )}
    >
      <div className="flex items-center gap-2 text-label-sm" style={{ color: isUser ? "#b0b2ff" : "#c5c7c9" }}>
        <span className="material-symbols-outlined text-sm">{isUser ? "person" : "auto_awesome"}</span>
        {isUser ? "You" : "Le Mem"}
      </div>

      <p className="mt-3 text-body-md leading-7" style={{ color: "#e5e2e1" }}>
        {content}
      </p>

      {contexts && contexts.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {contexts.map((context) => (
            <span key={context} className="context-chip text-label-sm">
              {context}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}