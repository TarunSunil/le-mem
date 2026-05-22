// src/app/api/chat/route.ts
import { authOptions } from "@/auth";
import { getCachedSession } from "@/lib/auth/get-session";
import { prisma } from "@/lib/db/prisma";
import { embedText } from "@/lib/ai/embed";
import { rankMemoriesForQuery } from "@/lib/memoryHelpers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await getCachedSession();
    if (!session?.user?.email) {
      if (!authOptions.providers.length) {
        return NextResponse.json(
          {
            error:
              "Google sign-in is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, then restart the app.",
          },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: "No active session found. Please sign in again." },
        { status: 401 }
      );
    }

    const body = (await req.json()) as {
      messages?: Array<{ role: string; content: string }>;
      mode?: "store" | "ask";
    };

    const { messages, mode = "store" } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request body: 'messages' must be an array." },
        { status: 400 }
      );
    }

    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "Google Gemini API key is not configured. Add GOOGLE_GEMINI_API_KEY to .env.local and restart the server.",
        },
        { status: 503 }
      );
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

          const memories = await prisma.memory.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            take: 300,
            include: {
              entities: { include: { entity: true } },
            },
          });

          if (memories.length > 0 && queryEmbedding) {
            try {
              const rawRows = await prisma.$queryRaw<
                Array<{ id: string; embedding: string | null }>
              >`
                SELECT id, embedding::text AS embedding
                FROM "Memory"
                WHERE "userId" = ${user.id}
                  AND embedding IS NOT NULL
              `;

              const embMap = new Map<string, number[]>();
              for (const row of rawRows) {
                if (row.embedding) {
                  try {
                    embMap.set(row.id, JSON.parse(row.embedding));
                  } catch {
                    // ignore
                  }
                }
              }
              for (const m of memories) {
                (m as any).embedding = embMap.get(m.id) ?? null;
              }
            } catch (e) {
              console.warn("Could not load embeddings:", e);
            }
          }

          const topK = mode === "ask" ? 10 : 5;
          const matches = rankMemoriesForQuery(
            latestUserMsg,
            memories,
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
          } else if (memories.length > 0) {
            memoryContext = memories
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

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generation_config: {
          temperature: mode === "ask" ? 0.2 : 0.5,
          max_output_tokens: mode === "ask" ? 1024 : 256,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      console.error("Gemini API error:", geminiResponse.status, errorBody);
      return NextResponse.json(
        { error: `Gemini API error (${geminiResponse.status}): ${errorBody}` },
        { status: geminiResponse.status }
      );
    }

    return new NextResponse(
      new ReadableStream({
        async start(controller) {
          try {
            const reader = geminiResponse.body?.getReader();
            if (!reader) throw new Error("No response body from Gemini");

            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });

              while (buffer.length > 0) {
                let braceCount = 0;
                let endIndex = -1;

                for (let i = 0; i < buffer.length; i++) {
                  if (buffer[i] === "{") braceCount++;
                  if (buffer[i] === "}") braceCount--;
                  if (braceCount === 0 && buffer[i] === "}") {
                    endIndex = i;
                    break;
                  }
                }

                if (endIndex === -1) break;

                const jsonStr = buffer.substring(0, endIndex + 1);
                buffer = buffer.substring(endIndex + 1).trim();

                const cleanJson = jsonStr.replace(/^[\s,\[\]]+/, "");
                if (!cleanJson) continue;

                try {
                  const json = JSON.parse(cleanJson);
                  if (json.candidates && Array.isArray(json.candidates)) {
                    for (const candidate of json.candidates) {
                      if (candidate.content?.parts) {
                        for (const part of candidate.content.parts) {
                          if (part.text) {
                            controller.enqueue(new TextEncoder().encode(part.text));
                          }
                        }
                      }
                    }
                  }
                } catch {
                  // ignore incomplete JSON chunks
                }
              }
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
    return NextResponse.json(
      {
        error:
          "Failed to process chat request. Check server logs and verify your Gemini API configuration.",
      },
      { status: 500 }
    );
  }
}