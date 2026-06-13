import { searchMemories } from "./memory-search";
import { ingestPipeline } from "@/lib/ai/ingest-pipeline";

export type ToolResult = { success: boolean; data: unknown; error?: string };

export async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  switch (toolName) {
    case "query_memory": {
      const query = String(args.query ?? "");
      const limit = Number(args.limit ?? 10);
      const { memories, memoryContext } = await searchMemories(userId, query, limit);
      return {
        success: true,
        data: {
          count: memories.length,
          context: memoryContext || "No relevant memories found.",
          snippets: memories.slice(0, 5).map((m) => ({
            id: m.id,
            summary: m.summary ?? m.content.slice(0, 120),
            date: m.createdAt,
          })),
        },
      };
    }

    case "create_note": {
      const content = String(args.content ?? "").trim();
      if (!content) return { success: false, data: null, error: "Empty content" };
      const pipeline = await ingestPipeline(content);
      return {
        success: true,
        data: {
          saved: pipeline.facts.length,
          facts: pipeline.facts.map((f) => f.text),
        },
      };
    }

    case "search_web": {
      const query = String(args.query ?? "").trim();
      if (!query) return { success: false, data: null, error: "Empty query" };

      const serperKey = process.env.SERPER_API_KEY;
      if (!serperKey) {
        return {
          success: true,
          data: {
            note: "Web search not configured. Add SERPER_API_KEY to enable.",
            results: [],
          },
        };
      }

      try {
        const res = await fetch("https://google.serper.dev/search", {
          method: "POST",
          headers: {
            "X-API-KEY": serperKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ q: query, num: 5 }),
        });

        const data = await res.json();
        const results = (data.organic ?? []).slice(0, 5).map((r: {
          title: string;
          snippet: string;
          link: string;
        }) => ({
          title: r.title,
          snippet: r.snippet,
          url: r.link,
        }));

        return { success: true, data: { results } };
      } catch (err) {
        return { success: false, data: null, error: String(err) };
      }
    }

    default:
      return { success: false, data: null, error: `Unknown tool: ${toolName}` };
  }
}