import { withGeminiFallback } from "@/lib/ai/gemini-fallback";
import { searchMemories } from "./memory-search";

export type ReasonerTrace = {
  type: "decompose" | "retrieve" | "synthesize";
  subQuestion?: string;
  index?: number;
  content: string;
};

const COMPLEX_QUERY_PATTERNS = [
  /compare/i,
  /summarize/i,
  /relationship between/i,
  /give me everything/i,
  /what.s the difference/i,
  /how does.+compare/i,
  /tell me all/i,
  /overview of/i,
  /history of/i,
  /everything (i know|you know|about)/i,
];

export function isComplexQuery(query: string): boolean {
  if (query.length < 80) return false;
  return COMPLEX_QUERY_PATTERNS.some((p) => p.test(query));
}

async function decomposeQuery(
  query: string,
  genAI: import("@google/generative-ai").GoogleGenerativeAI
): Promise<string[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const prompt = `Break the following user query into 2-4 independent sub-questions that together fully answer the original. 
Return ONLY a JSON array of strings. No explanation, no markdown fences.

Query: "${query}"

Example output: ["What projects is the user working on?", "What is their current status on each project?"]`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed) && parsed.every((s) => typeof s === "string")) {
      return parsed.slice(0, 4);
    }
  } catch {
    // fallback: treat original query as single sub-question
  }
  return [query];
}

export async function runReasonerAgent(
  userId: string,
  query: string,
  onTrace: (step: ReasonerTrace) => void
): Promise<string> {
  return withGeminiFallback(async (genAI) => {
    // Step 1: Decompose
    const subQuestions = await decomposeQuery(query, genAI);
    onTrace({
      type: "decompose",
      content: JSON.stringify(subQuestions, null, 2),
    });

    // Step 2: Parallel retrieval for each sub-question
    const retrievals = await Promise.all(
      subQuestions.map(async (sq, i) => {
        const { memoryContext, memories } = await searchMemories(userId, sq, 8);
        onTrace({
          type: "retrieve",
          subQuestion: sq,
          index: i + 1,
          content: memoryContext || "No relevant memories found.",
        });
        return { subQuestion: sq, memoryContext, count: memories.length };
      })
    );

    // Step 3: Synthesize
    const chunksText = retrievals
      .map(
        (r, i) =>
          `Sub-question ${i + 1}: ${r.subQuestion}\nMemory context:\n${r.memoryContext || "(none)"}`
      )
      .join("\n\n---\n\n");

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const synthesisPrompt = `You are a personal memory assistant. The user asked:
"${query}"

To answer this, the following sub-questions were investigated and memory retrieved:

${chunksText}

Now synthesize a comprehensive, well-organized answer to the original question using only the information above. 
Be direct and specific. If certain sub-questions had no relevant memories, acknowledge that gap.`;

    const result = await model.generateContent(synthesisPrompt);
    const answer = result.response.text();

    onTrace({ type: "synthesize", content: answer });
    return answer;
  });
}