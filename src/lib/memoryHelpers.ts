// src/lib/memoryHelpers.ts

export function isQuestionLike(text?: string): boolean {
  if (!text) return false;
  const t = text.trim().toLowerCase();
  if (t.length === 0) return false;

  const normalized = t.replace(/\s+/g, " ");
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
    "was",
    "were",
    "can",
    "could",
    "would",
    "should",
    "which",
    "whats",
    "whos",
  ];

  if (normalized.includes("?")) return true;

  for (const w of interrogatives) {
    if (normalized.startsWith(w + " ") || normalized === w) return true;
  }

  const commandVerbs = [
    "list",
    "show",
    "tell",
    "give",
    "find",
    "search",
    "lookup",
    "fetch",
    "display",
    "summarize",
    "recap",
    "outline",
    "explain",
    "remind",
    "retrieve",
    "get",
    "provide",
    "share",
  ];

  const commandPattern = new RegExp(
    `^(please\\s+)?(${commandVerbs.join("|")})\\b`
  );
  if (commandPattern.test(normalized)) return true;

  if (/^(can|could|would|will|should|may|might)\s+you\b/.test(normalized)) return true;
  if (/^(tell|show|remind)\s+me\b/.test(normalized)) return true;

  return false;
}

export function makeMemoryTitle(text?: string, maxWords = 16, maxChars = 120): string {
  if (!text) return "Memory";
  const cleaned = text.trim().replace(/\s+/g, " ");
  let base = cleaned;

  const firstStop = cleaned.search(/[.!?]/);
  if (firstStop > 0 && firstStop < maxChars) {
    base = cleaned.slice(0, firstStop + 1);
  }

  const words = base.split(" ");
  if (words.length > maxWords) {
    base = words.slice(0, maxWords).join(" ");
  }

  if (base.length > maxChars) {
    base = base.slice(0, maxChars - 3) + "...";
  }

  return base;
}

export function splitFactsHeuristic(text?: string): string[] {
  if (!text) return [];
  const cleaned = text.trim().replace(/\r\n/g, "\n");
  if (!cleaned) return [];

  const roughChunks = cleaned
    .split(/\n+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .flatMap((chunk) => chunk.split(/[.!?]+\s+/).map((item) => item.trim()))
    .filter(Boolean);

  const results: string[] = [];

  for (const chunk of roughChunks) {
    const likeMatch = chunk.match(
      /^i\s+(like|love|enjoy|prefer|am into|am interested in)\s+(.+)$/i
    );
    const hobbyMatch = chunk.match(
      /^my\s+(hobbies|interests)\s+(include|are)\s+(.+)$/i
    );

    if (likeMatch) {
      const items = likeMatch[2]
        .replace(/\band\b/gi, ",")
        .split(",")
        .map((item) => item.replace(/[.!?]+$/, "").trim())
        .filter(Boolean);

      if (items.length > 1) {
        for (const item of items) {
          results.push(`I like ${item}`);
        }
        continue;
      }
    }

    if (hobbyMatch) {
      const items = hobbyMatch[3]
        .replace(/\band\b/gi, ",")
        .split(",")
        .map((item) => item.replace(/[.!?]+$/, "").trim())
        .filter(Boolean);

      for (const item of items) {
        results.push(`My hobbies include ${item}`);
      }
      continue;
    }

    results.push(chunk);
  }

  return results
    .map((item) => item.replace(/\s+/g, " ").trim())
    .filter((item) => item.length > 0);
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
  const hobbyTokens = new Set(["hobby", "hobbies", "interest", "interests"]);
  const isHobbyQuery = tokens.some((token) => hobbyTokens.has(token));

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

      if (isHobbyQuery && /\b(i like|i love|i enjoy|my hobbies|my interests)\b/.test(searchableParts)) {
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
