// src/lib/memoryHelpers.ts

export function isQuestionLike(text?: string): boolean {
  if (!text) return false;
  const t = text.trim().toLowerCase();
  if (t.length === 0) return false;

  // Heuristic: ends with a question mark or starts with common interrogatives
  const interrogatives = [
    "what",
    "who",
    "how",
    "why",
    "when",
    "where",
    "did",
    "do",
    "does",
    "is",
    "are",
    "can",
    "could",
    "would",
    "should",
    "which",
  ];

  if (t.endsWith("?")) return true;

  for (const w of interrogatives) {
    if (t.startsWith(w + " ") || t === w) return true;
  }

  // Short inputs that look like questions
  if (t.split(" ").length <= 6 && t.endsWith("?")) return true;

  return false;
}

export function makeMemoryTitle(text?: string, maxWords = 8): string {
  if (!text) return "Memory";
  const cleaned = text.trim().replace(/\s+/g, " ");
  const words = cleaned.split(" ").slice(0, maxWords);
  let title = words.join(" ");
  if (title.length > 60) title = title.slice(0, 57) + "...";
  return title;
}

export function estimateTokens(text?: string): number {
  if (!text) return 0;
  // very rough estimate: 1 token ≈ 0.75 words
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 0.75));
}

export function humanizeEntityType(t?: string): string {
  if (!t) return "";
  const lowered = t.toLowerCase();
  // Map known enums to friendly names
  const map: Record<string, string> = {
    person: "Person",
    place: "Place",
    project: "Project",
    event: "Event",
    health: "Health",
    travel: "Travel",
    topic: "Topic",
    organization: "Organization",
  };
  return map[lowered] || t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

export function tokenizeSearchText(text?: string): string[] {
  if (!text) return [];

  const stopWords = new Set([
    "the",
    "and",
    "or",
    "for",
    "with",
    "this",
    "that",
    "from",
    "what",
    "when",
    "where",
    "why",
    "how",
    "can",
    "could",
    "should",
    "would",
    "do",
    "does",
    "did",
    "is",
    "are",
    "was",
    "were",
    "my",
    "your",
    "our",
    "me",
    "i",
    "to",
    "of",
    "in",
    "on",
    "it",
    "as",
    "at",
    "by",
    "an",
    "a",
    "be",
  ]);

  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !stopWords.has(token));
}

export function cosineSimilarity(a?: number[] | null, b?: number[] | null): number {
  if (!a || !b || a.length === 0 || b.length === 0 || a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  const denominator = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);
  if (denominator === 0) return 0;

  return dot / denominator;
}

export type MemorySearchCandidate = {
  id: string;
  content: string;
  rawInput?: string;
  summary?: string | null;
  tags?: string[] | null;
  embedding?: number[] | null;
  entities?: Array<{ entity?: { name?: string | null } | null }>;
  createdAt?: Date;
};

export function rankMemoriesForQuery(
  query: string,
  memories: MemorySearchCandidate[],
  queryEmbedding?: number[] | null,
  limit = 5
): MemorySearchCandidate[] {
  const tokens = tokenizeSearchText(query);

  const scored = memories
    .map((memory) => {
      const searchableParts = [
        memory.summary ?? "",
        memory.content ?? "",
        memory.rawInput ?? "",
        ...(memory.tags ?? []),
        ...(memory.entities ?? []).map((item) => item.entity?.name ?? ""),
      ]
        .join(" ")
        .toLowerCase();

      let score = 0;

      for (const token of tokens) {
        if (searchableParts.includes(token)) {
          score += 1;
        }
      }

      if (queryEmbedding && memory.embedding) {
        score += cosineSimilarity(queryEmbedding, memory.embedding) * 4;
      }

      if (memory.summary && tokens.some((token) => memory.summary!.toLowerCase().includes(token))) {
        score += 1;
      }

      if (memory.tags && memory.tags.some((tag) => tokens.some((token) => tag.toLowerCase().includes(token)))) {
        score += 1.5;
      }

      if (memory.createdAt) {
        const ageMs = Date.now() - memory.createdAt.getTime();
        const ageBonus = Math.max(0, 1 - ageMs / (1000 * 60 * 60 * 24 * 90));
        score += ageBonus * 0.25;
      }

      return { memory, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ memory }) => memory);

  return scored;
}
