// src/lib/ai/embed.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { withGeminiFallback } from "./gemini-fallback";

// Pad to 1536 because Prisma Schema is hardcoded to vector(1536)
function padTo1536(vector: number[]): number[] {
  const padded = new Array(1536).fill(0);
  for (let i = 0; i < vector.length && i < 1536; i++) {
    padded[i] = vector[i];
  }
  return padded;
}

export async function embedText(text: string): Promise<number[]> {
  try {
    if (!text.trim()) {
      return [];
    }

    return await withGeminiFallback(async (genAI) => {
      const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
      const result = await model.embedContent(text);
      return padTo1536(result.embedding.values);
    });
  } catch (error) {
    console.error("Embedding failed:", error);
    return [];
  }
}

export async function embedMultiple(texts: string[]): Promise<number[][]> {
  try {
    if (texts.length === 0) {
      return [];
    }

    return await withGeminiFallback(async (genAI) => {
      const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
      const batchRequests = texts.map(t => ({ content: { parts: [{ text: t }], role: "user" } }));
      const result = await model.batchEmbedContents({ requests: batchRequests });
      return result.embeddings.map(e => padTo1536(e.values));
    });
  } catch (error) {
    console.error("Batch embedding failed:", error);
    return texts.map(() => []);
  }
}
