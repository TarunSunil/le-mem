import { withGeminiFallback } from "@/lib/ai/gemini-fallback";
import { TOOL_DECLARATIONS } from "./tools";
import { executeTool } from "./tool-executor";
import { searchMemories } from "./memory-search";
import { runReasonerAgent, isComplexQuery } from "./reasoner";

export type TraceStep = {
  type: "thought" | "tool_call" | "tool_result" | "synthesis" | "decompose" | "retrieve";
  toolName?: string;
  subQuestion?: string;
  index?: number;
  content: string;
};

const MAX_ITERATIONS = 5;

export async function runAgentLoop(
  userId: string,
  messages: Array<{ role: string; content: string }>,
  onTrace: (step: TraceStep) => void
): Promise<string> {
  const lastUserMsg =
    [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  // Route complex queries to the multi-step reasoner
  if (isComplexQuery(lastUserMsg)) {
    return runReasonerAgent(userId, lastUserMsg, (step) =>
      onTrace(step as TraceStep)
    );
  }

  // Standard tool-calling agent loop
  const { memoryContext } = await searchMemories(userId, lastUserMsg, 5);

  const systemPrompt = [
    "You are FYI, an intelligent personal memory assistant with access to tools.",
    "Rules:",
    "- Use query_memory for anything about the user's personal life, projects, or history.",
    "- Use search_web for current events or facts not stored in memory.",
    "- Use create_note only when the user explicitly asks to save something.",
    "- Never fabricate information. If memory returns nothing, say so.",
    "- After gathering information, synthesize a clear direct answer.",
    memoryContext
      ? `\nInitial memory context (pre-fetched):\n${memoryContext}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return withGeminiFallback(async (genAI) => {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: [{ functionDeclarations: TOOL_DECLARATIONS as any }],
      systemInstruction: systemPrompt,
    });

    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({ history });
    const lastContent = messages[messages.length - 1].content;

    let response = await chat.sendMessage(lastContent);
    let iterations = 0;

    while (iterations < MAX_ITERATIONS) {
      const parts = response.response.candidates?.[0]?.content?.parts ?? [];
      const fnCall = parts.find((p) => "functionCall" in p && p.functionCall);

      if (!fnCall || !("functionCall" in fnCall) || !fnCall.functionCall) {
        const text = parts.map((p) => ("text" in p ? p.text : "")).join("");
        onTrace({ type: "synthesis", content: text });
        return text;
      }

      const { name, args } = fnCall.functionCall;
      onTrace({
        type: "tool_call",
        toolName: name,
        content: JSON.stringify(args, null, 2),
      });

      const result = await executeTool(
        name,
        args as Record<string, unknown>,
        userId
      );
      onTrace({
        type: "tool_result",
        toolName: name,
        content: JSON.stringify(result.data, null, 2),
      });

      response = await chat.sendMessage([
        {
          functionResponse: {
            name,
            response: (result.data ?? { error: result.error }) as object,
          },
        },
      ]);

      iterations++;
    }

    return (
      response.response.text() ||
      "Reached tool call limit. Here is what I found so far."
    );
  });
}