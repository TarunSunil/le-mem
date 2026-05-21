import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

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
        "max-w-[88%] rounded-2xl px-4 py-3 md:max-w-[72%] md:rounded-3xl md:px-5 md:py-4",
        isUser ? "ml-auto bubble-user" : "bubble-ai"
      )}
    >
      <div
        className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] md:text-label-sm md:tracking-normal"
        style={{ color: isUser ? "var(--fyi-accent)" : "var(--fyi-muted)" }}
      >
        <span className="material-symbols-outlined text-sm md:text-base">{isUser ? "person" : "auto_awesome"}</span>
        {isUser ? "You" : "FYI"}
      </div>

      <div className="mt-2 fyi-markdown text-sm leading-6 md:mt-3 md:text-base md:leading-7" style={{ color: "#e5e2e1" }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
          {content}
        </ReactMarkdown>
      </div>

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