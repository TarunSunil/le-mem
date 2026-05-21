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

    const { messages } = (await req.json()) as {
      messages?: Array<{ role: string; content: string }>;
    };

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

    // Build memory context for the system prompt
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
          // Generate query embedding (best-effort)
          let queryEmbedding: number[] | null = null;
          try {
            const emb = await embedText(latestUserMsg);
            if (emb && emb.length > 0) queryEmbedding = emb;
          } catch (e) {
            console.warn("Embedding generation skipped:", e);
          }

          // Fetch recent memories
          const memories = await prisma.memory.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            take: 300,
            include: {
              entities: {
                include: { entity: true },
              },
            },
          });

          // Attach stored embeddings via raw query (safe approach)
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
                    // ignore parse errors
                  }
                }
              }
              for (const m of memories) {
                (m as any).embedding = embMap.get(m.id) ?? null;
              }
            } catch (e) {
              console.warn("Could not load embeddings for chat context:", e);
            }
          }

          // Use top 10 matches but ALWAYS call Gemini
          const matches = rankMemoriesForQuery(
            latestUserMsg,
            memories,
            queryEmbedding,
            10
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
            // Fallback: provide the 5 most recent memories
            memoryContext = memories
              .slice(0, 5)
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
          }
        }
      } catch (e) {
        console.warn("Memory lookup failed for chat context:", e);
      }
    }

    const systemPrompt = memoryContext
      ? `You are FYI, an AI assistant for a personal memory operating system.
Your role is to help users organize, retrieve, and understand their memories and connections.
Answer using ONLY the relevant memories listed below. Do not invent or infer facts beyond what is provided.
If the memories do not contain the answer, say you don't have that recorded yet and suggest the user add it.
Be conversational and use markdown formatting when helpful.

Relevant memories:
${memoryContext}`
      : `You are FYI, an AI assistant for a personal memory operating system.
You currently have no stored memories for this user. Let them know they haven't added any memories yet
and encourage them to start by sharing something about themselves in the chat.`;

    // Convert messages to Gemini format
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
          temperature: 0.7,
          max_output_tokens: 1024,
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
                            controller.enqueue(
                              new TextEncoder().encode(part.text)
                            );
                          }
                        }
                      }
                    }
                  }
                } catch (e) {
                  // ignore JSON parse errors for incomplete chunks
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