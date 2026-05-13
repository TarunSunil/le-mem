// src/lib/ai/embed.ts
import { OpenAI } from "openai";

const apiKey = process.env.OPENAI_API_KEY;
const client = apiKey ? new OpenAI({ apiKey }) : null;

export async function embedText(text: string): Promise<number[]> {
  try {
    if (!client) {
      return [];
    }

    const response = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
    });

    return response.data[0]?.embedding || [];
  } catch (error) {
    console.error("Embedding failed:", error);
    return [];
  }
}

export async function embedMultiple(texts: string[]): Promise<number[][]> {
  try {
    if (!client) {
      return texts.map(() => []);
    }

    const response = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: texts,
      encoding_format: "float",
    });

    return response.data.map((item) => item.embedding);
  } catch (error) {
    console.error("Batch embedding failed:", error);
    return texts.map(() => []);
  }
}
