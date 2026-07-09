import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ExtractedEntities } from "@/types";
import { isQuestionLike, splitFactsHeuristic } from "@/lib/memoryHelpers";
import { normalizeEntityName } from "@/lib/entity-normalization";
import { withGeminiFallback } from "./gemini-fallback";

export type IngestedFact = {
  text: string;
  entities: ExtractedEntities;
  fallbackTopic?: string | null;
  date?: string | null;
};

function getCombinedPrompt(currentDate: string): string {
  return `You are a memory normalization and entity extraction engine.

The current actual date is: ${currentDate}

Given a single user message, return ONLY raw JSON with this schema:
{
  "facts": [
    {
      "text": "I went to Tokyo on 19th May 2026",
      "entities": {
        "people": [],
        "organizations": [],
        "places": [{"name": "Tokyo", "type": "city"}],
        "projects": [],
        "topics": [{"name": "travel"}],
        "events": [],
        "relationships": []
      },
      "fallbackTopic": null,
      "date": "2026-05-19T00:00:00.000Z"
    }
  ]
}

Rules:
- Extract durable, long-term facts only.
- Skip questions, requests, and temporary events.
- Split lists into separate facts.
- Use first-person "I ..." sentences.
- If a fact has no entities across all categories, set fallbackTopic to a short normalized noun phrase (1-4 words, no punctuation, no pronouns or determiners).
- If a fact has any entities, set fallbackTopic to null.
- Date extraction logic: If the user mentions a specific date ("19th may 2026") OR a relative date ("today", "yesterday", "last week"), calculate and provide the absolute ISO 8601 date string relative to the current actual date. If no date context is provided whatsoever, set "date" to null.
- Return [] for empty facts.
- Return empty arrays for missing categories.
- Return raw JSON only; no markdown or code fences.`;
}

function emptyEntities(): ExtractedEntities {
  return {
    people: [],
    organizations: [],
    places: [],
    projects: [],
    topics: [],
    events: [],
    relationships: [],
  };
}

function normalizeEntities(raw?: Partial<ExtractedEntities>): ExtractedEntities {
  const normalizeList = <T extends { name: string }>(items: T[] | undefined): T[] =>
    (items ?? [])
      .map((item) => ({ ...item, name: item.name.trim().replace(/\s+/g, " ") }))
      .filter((item) => normalizeEntityName(item.name).length > 0) as T[];

  return {
    people: normalizeList(raw?.people),
    organizations: normalizeList(raw?.organizations),
    places: normalizeList(raw?.places),
    projects: normalizeList(raw?.projects),
    topics: normalizeList(raw?.topics),
    events: normalizeList(raw?.events),
    relationships: raw?.relationships ?? [],
  };
}

function normalizeFallbackTopic(value: unknown): string | null {
  const cleaned = String(value ?? "").trim().replace(/\s+/g, " ");
  if (!cleaned) return null;

  const trimmed = cleaned.replace(/^[\s"'`]+|[\s"'`]+$/g, "");
  const withoutPunct = trimmed.replace(/[.?!,:;()\[\]{}]/g, "");
  const withoutPrefix = withoutPunct.replace(
    /^(i|my|the|a|an|this|that|these|those)\s+/i,
    ""
  );

  const words = withoutPrefix.split(" ").filter(Boolean);
  if (words.length === 0) return null;

  const short = words.slice(0, 4).join(" ");
  if (short.length > 60) return null;

  return short;
}

function normalizeFact(raw: unknown): IngestedFact | null {
  if (!raw) return null;

  if (typeof raw === "string") {
    const text = raw.trim().replace(/\s+/g, " ");
    if (!text) return null;
    return { text, entities: emptyEntities(), fallbackTopic: null, date: null };
  }

  const text = String((raw as { text?: string }).text ?? "")
    .trim()
    .replace(/\s+/g, " ");
  if (!text) return null;

  const entities = normalizeEntities((raw as { entities?: ExtractedEntities }).entities);
  const fallbackTopic = normalizeFallbackTopic((raw as { fallbackTopic?: string }).fallbackTopic);

  let parsedDate: string | null = null;
  const rawDate = (raw as { date?: string }).date;
  if (rawDate && typeof rawDate === "string") {
    const dateObj = new Date(rawDate);
    if (!isNaN(dateObj.getTime())) {
      parsedDate = dateObj.toISOString();
    }
  }

  return { text, entities, fallbackTopic, date: parsedDate };
}

function buildFallbackFacts(text: string): IngestedFact[] {
  const facts = splitFactsHeuristic(text)
    .map((fact) => fact.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .filter((fact) => !isQuestionLike(fact));

  return facts.map((fact) => ({
    text: fact,
    entities: emptyEntities(),
    fallbackTopic: null,
    date: null
  }));
}

export async function ingestPipeline(
  text: string,
  currentDateOffset: string = new Date().toISOString()
): Promise<{ facts: IngestedFact[] }> {
  const fallback = buildFallbackFacts(text);
  const prompt = getCombinedPrompt(currentDateOffset);

  try {
    return await withGeminiFallback(async (genAI) => {
      const model = genAI.getGenerativeModel({
        model: process.env.EXTRACTION_MODEL ?? "gemini-1.5-flash",
      });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text }] }],
        systemInstruction: prompt,
        generationConfig: { temperature: 0.2 },
      });

      let content = result.response.text();
      content = content.replace(/^```json\s*/, "");
      content = content.replace(/^```\s*/, "");
      content = content.replace(/```\s*$/, "");
      content = content.trim();

      const parsed = JSON.parse(content) as { facts?: unknown[] } | null;
      if (!parsed || !Array.isArray(parsed.facts)) {
        return { facts: fallback };
      }

      const normalized = parsed.facts
        .map((fact) => normalizeFact(fact))
        .filter((fact): fact is IngestedFact => Boolean(fact))
        .filter((fact) => !isQuestionLike(fact.text));

      return normalized.length > 0 ? { facts: normalized } : { facts: fallback };
    });
  } catch (error) {
    console.error("Ingest pipeline failed:", error);
    return { facts: fallback };
  }
}
