// src/app/api/chat/route.ts
import { authOptions } from "@/auth";
import { getCachedSession } from "@/lib/auth/get-session";
import { prisma } from "@/lib/db/prisma";
import { embedText } from "@/lib/ai/embed";
import { rankMemoriesForQuery } from "@/lib/memoryHelpers";
import { apiError } from "@/lib/api-error";
import { checkRateLimit } from "@/lib/rateLimit";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await getCachedSession();
    if (!session?.user?.email) {
      if (!authOptions.providers.length) {
        return apiError(
          "Google sign-in is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, then restart the app.",
          503
        );
      }
      return apiError("No active session found. Please sign in again.", 401);
    }

    const body = (await req.json()) as {
      messages?: Array<{ role: string; content: string }>;
      mode?: "store" | "ask";
    };

    const { messages, mode = "store" } = body;

    if (!messages || !Array.isArray(messages)) {
      return apiError("Invalid request body: 'messages' must be an array.", 400);
    }

    if (messages.length > 50) {
      return apiError("Invalid messages array (max 50 messages)", 400);
    }

    if (!process.env.GOOGLE_GEMINI_API_KEY && !process.env.GOOGLE_GEMINI_API_KEY_2) {
      return apiError(
        "Google Gemini API key is not configured. Add GOOGLE_GEMINI_API_KEY to .env.local and restart the server.",
        503
      );
    }

    if (!checkRateLimit(`chat:${session.user.email}`)) {
      return apiError("Too many requests. Please wait a moment.", 429);
    }

    let memoryContext = "";
    const latestUserMsg = messages
      .slice()
      .reverse()
      .find((m) => m.role !== "assistant")?.content;

    if (latestUserMsg) {
      try {
        const user = await prisma.user.findUnique({
          where: { email: session.user.email },
        });

        if (user) {
          let queryEmbedding: number[] | null = null;
          try {
            const emb = await embedText(latestUserMsg);
            if (emb && emb.length > 0) queryEmbedding = emb;
          } catch (e) {
            console.warn("Embedding generation skipped:", e);
          }

          let rawMemories: Array<{
            id: string;
            content: string;
            rawInput: string;
            summary: string | null;
            tags: string[] | null;
            createdAt: Date;
            embedding: string | null;
            entities: unknown;
          }> = [];

          if (queryEmbedding) {
            const vectorStr = `[${queryEmbedding.join(",")}]`;
            rawMemories = await prisma.$queryRaw<
              Array<{
                id: string;
                content: string;
                rawInput: string;
                summary: string | null;
                tags: string[] | null;
                createdAt: Date;
                embedding: string | null;
                entities: unknown;
              }>
            >`
              SELECT
                m.id,
                m.content,
                m."rawInput",
                m.summary,
                m.tags,
                m."createdAt",
                m.embedding::text AS embedding,
                COALESCE(
                  json_agg(
                    json_build_object('entity', json_build_object('name', e.name))
                  ) FILTER (WHERE e.id IS NOT NULL),
                  '[]'
                ) AS entities
              FROM "Memory" m
              LEFT JOIN "MemoryEntity" me ON me."memoryId" = m.id
              LEFT JOIN "Entity" e ON e.id = me."entityId"
              WHERE m."userId" = ${user.id}
              GROUP BY m.id, m.content, m."rawInput", m.summary, m.tags, m."createdAt", m.embedding
              ORDER BY
                CASE
                  WHEN m.embedding IS NOT NULL THEN m.embedding <=> ${vectorStr}::vector
                  ELSE 1.0
                END
              LIMIT 50
            `;
          } else {
            rawMemories = await prisma.$queryRaw<
              Array<{
                id: string;
                content: string;
                rawInput: string;
                summary: string | null;
                tags: string[] | null;
                createdAt: Date;
                embedding: string | null;
                entities: unknown;
              }>
            >`
              SELECT
                m.id,
                m.content,
                m."rawInput",
                m.summary,
                m.tags,
                m."createdAt",
                m.embedding::text AS embedding,
                COALESCE(
                  json_agg(
                    json_build_object('entity', json_build_object('name', e.name))
                  ) FILTER (WHERE e.id IS NOT NULL),
                  '[]'
                ) AS entities
              FROM "Memory" m
              LEFT JOIN "MemoryEntity" me ON me."memoryId" = m.id
              LEFT JOIN "Entity" e ON e.id = me."entityId"
              WHERE m."userId" = ${user.id}
              GROUP BY m.id, m.content, m."rawInput", m.summary, m.tags, m."createdAt", m.embedding
              ORDER BY m."createdAt" DESC
              LIMIT 300
            `;
          }

          const parsedMemories = rawMemories.map((memory) => {
            let parsedEntities: Array<{ entity?: { name?: string | null } | null }> = [];
            if (Array.isArray(memory.entities)) {
              parsedEntities = memory.entities as Array<{ entity?: { name?: string | null } | null }>;
            } else if (typeof memory.entities === "string") {
              try {
                parsedEntities = JSON.parse(memory.entities) as Array<{
                  entity?: { name?: string | null } | null;
                }>;
              } catch {
                parsedEntities = [];
              }
            }

            let parsedEmbedding: number[] | null = null;
            if (memory.embedding) {
              try {
                parsedEmbedding = JSON.parse(memory.embedding);
              } catch {
                parsedEmbedding = null;
              }
            }

            return {
              ...memory,
              embedding: parsedEmbedding,
              entities: parsedEntities,
            };
          });

          const topK = mode === "ask" ? 20 : 5;
          const matches = rankMemoriesForQuery(
            latestUserMsg,
            parsedMemories,
            queryEmbedding,
            topK
          );

          if (matches.length > 0) {
            memoryContext = matches
              .map((m) => {
                const dateStr = m.createdAt
                  ? new Date(m.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "";
                const prefix = dateStr ? `[${dateStr}] ` : "";
                return `- ${prefix}${m.summary || m.content.slice(0, 300)}`;
              })
              .join("\n");
          } else if (parsedMemories.length > 0) {
            memoryContext = parsedMemories
              .slice(0, 5)
              .map((m) => `- ${m.summary || m.content.slice(0, 300)}`)
              .join("\n");
          }
        }
      } catch (e) {
        console.warn("Memory lookup failed:", e);
      }
    }

    let systemPrompt: string;

    if (mode === "ask") {
      systemPrompt = memoryContext
        ? `You are FYI, a personal memory assistant. Answer the user's question using ONLY the memories listed below. Be direct, clear, and human.

Rules you must follow:
- Answer ONLY what was asked. Never add unrequested information.
- If the answer is a list, use a clean bullet list.
- If it is a single fact, answer in one or two sentences.
- Use markdown for structure only when it genuinely helps.
- Do NOT say "Based on your memories" or add any preamble. Start with the answer immediately.
- Do NOT invent, infer, or assume anything not present in the memories below.
- If the memories do not contain the answer, say exactly: "I don't have that recorded yet." and nothing more.

Memories:
${memoryContext}`
        : `You are FYI, a personal memory assistant. The user has asked a question but has no memories stored yet.
Reply with exactly one sentence: "I don't have anything stored yet - switch to Store mode and tell me about yourself first."`;
    } else {
      systemPrompt = memoryContext
        ? `You are FYI, a personal memory assistant. The user has just shared information for you to remember. Briefly acknowledge what you've understood and saved in 1-2 friendly sentences. Do NOT ask follow-up questions. Do NOT volunteer extra information.

What was just stored:
${memoryContext}`
        : `You are FYI, a personal memory assistant. The user has just shared something with you. Acknowledge in one warm sentence that you've noted it, without repeating it back verbatim.`;
    }

    const contents = messages.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const key1 = process.env.GOOGLE_GEMINI_API_KEY;
    const key2 = process.env.GOOGLE_GEMINI_API_KEY_2;
    
    if (!key1 && !key2) {
      return apiError("No Google Gemini API key configured.", 503);
    }

    const payload = JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
      generation_config: {
        temperature: mode === "ask" ? 0.2 : 0.5,
        max_output_tokens: mode === "ask" ? 1024 : 256,
      },
    });

    let geminiResponse: Response | undefined;
    const tryFetch = async (key: string) => {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${key}`;
      return fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      });
    };

    if (key1) {
      geminiResponse = await tryFetch(key1);
      if (geminiResponse.status === 429 && key2) {
        console.warn("First API key hit quota, switching to second key...");
        geminiResponse = await tryFetch(key2);
      }
    } else if (key2) {
      geminiResponse = await tryFetch(key2);
    }

    if (!geminiResponse || !geminiResponse.ok) {
      const errorBody = await geminiResponse?.text() || "Unknown error";
      const status = geminiResponse?.status || 500;
      console.error("Gemini API error:", status, errorBody);
      return apiError(`Gemini API error (${status})`, status, errorBody);
    }

    return new NextResponse(
      new ReadableStream({
        async start(controller) {
          try {
            const reader = geminiResponse.body?.getReader();
            if (!reader) throw new Error("No response body from Gemini");

            const decoder = new TextDecoder();
            const encoder = new TextEncoder();
            let buffer = "";

            const emitTextFromChunk = (chunk: unknown) => {
              if (!chunk || typeof chunk !== "object") return;
              const candidates = (chunk as {
                candidates?: Array<{
                  content?: { parts?: Array<{ text?: string }> };
                }>;
              }).candidates;

              if (!Array.isArray(candidates)) return;

              for (const candidate of candidates) {
                for (const part of candidate.content?.parts ?? []) {
                  if (part.text) {
                    controller.enqueue(encoder.encode(part.text));
                  }
                }
              }
            };

            const parsePayload = (payloadLine: string) => {
              const payloadText = payloadLine.trim();
              if (!payloadText || payloadText === "[DONE]") return;

              try {
                const parsed = JSON.parse(payloadText);
                if (Array.isArray(parsed)) {
                  parsed.forEach(emitTextFromChunk);
                } else {
                  emitTextFromChunk(parsed);
                }
              } catch (error) {
                console.warn("Skipping malformed Gemini stream chunk:", error);
              }
            };

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });

              const lines = buffer.split(/\r?\n/);
              buffer = lines.pop() ?? "";

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;
                parsePayload(trimmed.startsWith("data:") ? trimmed.slice(5) : trimmed);
              }
            }

            const tail = buffer.trim();
            if (tail) {
              parsePayload(tail.startsWith("data:") ? tail.slice(5) : tail);
            }

            controller.close();
          } catch (error) {
            console.error("Streaming error:", error);
            controller.error(error);
          }
        },
      }),
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      }
    );
  } catch (error) {
    console.error("Chat error:", error);
    return apiError(
      "Failed to process chat request. Check server logs and verify your Gemini API configuration.",
      500,
      String(error)
    );
  }
}
