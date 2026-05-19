import { GoogleGenerativeAI } from "@google/generative-ai";
import { isQuestionLike, splitFactsHeuristic } from "@/lib/memoryHelpers";

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const SPLIT_PROMPT = `You are a memory normalization engine.

Given a single user message, return a JSON array of atomic, durable facts for long-term memory.

Keep only stable facts (identity, preferences, hobbies, skills, projects, devices, relationships, recurring habits). Exclude questions, requests, and temporary events.

Each array element must be a short standalone sentence. Use the user's point of view ("I ..."). If the input contains lists (for example hobbies), split them into separate items.

Return raw JSON array only, starting with [ and ending with ]. If no durable facts, return []`;

function normalizeFacts(facts: string[]): string[] {
  const seen = new Set<string>();
  const cleaned = facts
    .map((item) => String(item || "").replace(/\s+/g, " ").trim())
    .filter((item) => item.length > 0)
    .filter((item) => !isQuestionLike(item));

  const deduped: string[] = [];
  for (const item of cleaned) {
    const key = item.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(item);
    }
  }

  return deduped;
}

export async function splitFacts(text: string): Promise<string[]> {
  const fallback = normalizeFacts(splitFactsHeuristic(text));
  if (!genAI) {
    return fallback;
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text }] }],
      systemInstruction: SPLIT_PROMPT,
      generationConfig: { temperature: 0.2 },
    });

    let content = result.response.text();
    content = content.replace(/^```json\s*/, "");
    content = content.replace(/^```\s*/, "");
    content = content.replace(/```\s*$/, "");
    content = content.trim();

    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) {
      return fallback;
    }

    const normalized = normalizeFacts(parsed);
    return normalized.length > 0 ? normalized : fallback;
  } catch (error) {
    console.error("Fact splitting failed:", error);
    return fallback;
  }
}
