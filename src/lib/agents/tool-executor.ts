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
      // Stub — wire to Serper/Brave/DuckDuckGo API later
      return {
        success: true,
        data: {
          note: "Web search not yet connected. Falling back to memory-only answer.",
          results: [],
        },
      };
    }

    default:
      return { success: false, data: null, error: `Unknown tool: ${toolName}` };
  }
}