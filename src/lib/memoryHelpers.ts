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

  if (/^(can|could|would|will|should|may|might)\s+you\b/.test(normalized))
    return true;
  if (/^(tell|show|remind)\s+me\b/.test(normalized)) return true;

  return false;
}

export function makeMemoryTitle(
  text?: string,
  maxWords = 16,
  maxChars = 120
): string {
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
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 0.75));
}

export function humanizeEntityType(t?: string): string {
  if (!t) return "";
  const lowered = t.toLowerCase();
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

  // FIX: Removed calendar words ('may', 'march', 'june', etc.) from stopwords
  // so date-based queries like "what happened on 17th May 2026" work correctly.
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
    "are",
    "was",
    "were",
    "your",
    "our",
    "me",
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
    // NOTE: "is", "my", "i" removed -- they appear in "I like / My hobbies" facts
    // NOTE: "may" removed -- it's a month name needed for date queries
  ]);

  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !stopWords.has(token));
}

export function cosineSimilarity(
  a?: number[] | null,
  b?: number[] | null
): number {
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

/** Month names mapped to their numeric string equivalents for date matching */
const MONTH_NAMES: Record<string, string> = {
  january: "01",
  jan: "01",
  february: "02",
  feb: "02",
  march: "03",
  mar: "03",
  april: "04",
  apr: "04",
  may: "05",
  june: "06",
  jun: "06",
  july: "07",
  jul: "07",
  august: "08",
  aug: "08",
  september: "09",
  sep: "09",
  sept: "09",
  october: "10",
  oct: "10",
  november: "11",
  nov: "11",
  december: "12",
  dec: "12",
};

/**
 * Extract a date hint from a query string, returning a simple string like
 * "2026-05-17" or "2026-05" that can be matched against memory timestamps.
 */
function extractDateHint(query: string): string | null {
  const q = query.toLowerCase();

  // Match "17th May 2026" / "May 17 2026" / "17 May 2026"
  const ordinalDay = q.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)\s+(\d{4})/);
  const monthFirst = q.match(/([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/);
  const yearMonth = q.match(/([a-z]+)\s+(\d{4})/);
  const isoDate = q.match(/(\d{4})-(\d{2})-(\d{2})/);

  if (isoDate) return isoDate[0];

  if (ordinalDay) {
    const [, day, monthStr, year] = ordinalDay;
    const month = MONTH_NAMES[monthStr];
    if (month) return `${year}-${month}-${day.padStart(2, "0")}`;
  }

  if (monthFirst) {
    const [, monthStr, day, year] = monthFirst;
    const month = MONTH_NAMES[monthStr];
    if (month) return `${year}-${month}-${day.padStart(2, "0")}`;
  }

  if (yearMonth) {
    const [, monthStr, year] = yearMonth;
    const month = MONTH_NAMES[monthStr];
    if (month) return `${year}-${month}`;
  }

  return null;
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

  // FIX: extract date hint so "17th May 2026" queries find date-tagged memories
  const dateHint = extractDateHint(query);

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

      // Keyword matching -- min-length now 2 chars (fixes single-letter tokens)
      for (const token of tokens) {
        if (token.length >= 2 && searchableParts.includes(token)) {
          score += 1;
        }
      }

      // Semantic similarity
      if (queryEmbedding && memory.embedding) {
        score += cosineSimilarity(queryEmbedding, memory.embedding) * 4;
      }

      // Summary field bonus
      if (
        memory.summary &&
        tokens.some((token) =>
          memory.summary!.toLowerCase().includes(token)
        )
      ) {
        score += 1;
      }

      // Tag bonus
      if (
        memory.tags &&
        memory.tags.some((tag) =>
          tokens.some((token) => tag.toLowerCase().includes(token))
        )
      ) {
        score += 1.5;
      }

      // Hobby query bonus
      if (
        isHobbyQuery &&
        /\b(i like|i love|i enjoy|my hobbies|my interests)\b/.test(
          searchableParts
        )
      ) {
        score += 3;
      }

      // Date-based scoring
      if (dateHint && memory.createdAt) {
        const memDateStr = memory.createdAt.toISOString().slice(0, 10);
        if (memDateStr.startsWith(dateHint)) {
          score += 5;
        }
      }

      // Recency bonus (small)
      if (memory.createdAt) {
        const ageMs = Date.now() - memory.createdAt.getTime();
        const ageBonus = Math.max(
          0,
          1 - ageMs / (1000 * 60 * 60 * 24 * 90)
        );
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