// src/lib/ai/gemini-fallback.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

function getErrorField(error: unknown, field: string): unknown {
  return error && typeof error === "object" && field in error
    ? (error as Record<string, unknown>)[field]
    : undefined;
}

function isQuotaError(error: unknown): boolean {
  if (getErrorField(error, "status") === 429) return true;

  const response = getErrorField(error, "response");
  if (getErrorField(response, "status") === 429) return true;

  const message = getErrorField(error, "message");
  return /429|quota/i.test(typeof message === "string" ? message : "");
}

export async function withGeminiFallback<T>(
  operation: (genAI: GoogleGenerativeAI) => Promise<T>
): Promise<T> {
  const key1 = process.env.GOOGLE_GEMINI_API_KEY;
  const key2 = process.env.GOOGLE_GEMINI_API_KEY_2;

  if (!key1 && !key2) {
    throw new Error("No Google Gemini API key configured.");
  }

  // Try the first key if available
  if (key1) {
    try {
      const genAI = new GoogleGenerativeAI(key1);
      return await operation(genAI);
    } catch (error: unknown) {
      if (!key2 || !isQuotaError(error)) {
        throw error;
      }
      console.warn("First API key hit quota (429), switching to second key...");
    }
  }

  // If first key failed with quota or was absent, try the second key
  if (key2) {
    const genAI = new GoogleGenerativeAI(key2);
    return await operation(genAI);
  }

  throw new Error("API keys exhausted or not configured properly.");
}
