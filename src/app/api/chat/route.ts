import { authOptions } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const token = await getToken({ req, secret: authOptions.secret });
    if (!token?.email) {
      return NextResponse.json(
        { error: "Session expired or unauthorized. Please sign in again." },
        { status: 401 }
      );
    }

    const { messages } = await req.json();

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
            "Google Gemini API key is not configured. Add GOOGLE_GEMINI_API_KEY to .env.local and restart the server. Get a free key at https://ai.google.dev",
        },
        { status: 503 }
      );
    }

    // System prompt for context-aware responses
    const systemPrompt = `You are Le Mem, an AI assistant for a personal memory operating system. 
Your role is to help users organize, retrieve, and understand their memories and connections.
Be conversational, helpful, and focus on extracting entities (people, places, projects, topics) when relevant.
When the user shares information, ask clarifying questions to better understand context.
Format responses clearly with markdown when helpful.`;

    // Convert messages to Gemini format
    const contents = messages.map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    // Call Gemini API with streaming
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
        {
          error: `Gemini API error (${geminiResponse.status}): ${errorBody}`,
        },
        { status: geminiResponse.status }
      );
    }

    // Return streaming response from Gemini
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
              
              // The Gemini streaming API returns an array of response objects
              // Try to parse complete JSON objects from the buffer
              while (buffer.length > 0) {
                // Find matching braces for JSON object
                let braceCount = 0;
                let endIndex = -1;
                
                for (let i = 0; i < buffer.length; i++) {
                  if (buffer[i] === '{') braceCount++;
                  if (buffer[i] === '}') braceCount--;
                  
                  if (braceCount === 0 && buffer[i] === '}') {
                    endIndex = i;
                    break;
                  }
                }
                
                if (endIndex === -1) break; // Incomplete JSON, wait for more data
                
                const jsonStr = buffer.substring(0, endIndex + 1);
                buffer = buffer.substring(endIndex + 1).trim();
                
                // Remove leading commas and array brackets
                const cleanJson = jsonStr.replace(/^[\s,\[\]]+/, '');
                if (!cleanJson) continue;
                
                try {
                  const json = JSON.parse(cleanJson);
                  
                  // Extract text from candidates
                  if (json.candidates && Array.isArray(json.candidates)) {
                    for (const candidate of json.candidates) {
                      if (candidate.content && candidate.content.parts) {
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
                  console.error("Failed to parse Gemini response:", cleanJson, e);
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

    if (error && typeof error === "object") {
      const maybeStatus = "status" in error ? Number((error as { status?: unknown }).status) : NaN;
      const maybeMessage =
        "message" in error && typeof (error as { message?: unknown }).message === "string"
          ? (error as { message: string }).message
          : "The chat provider returned an error.";

      if (Number.isFinite(maybeStatus) && maybeStatus > 0) {
        return NextResponse.json(
          {
            error: `Gemini API request failed (${maybeStatus}): ${maybeMessage}`,
          },
          { status: maybeStatus }
        );
      }
    }

    return NextResponse.json(
      {
        error:
          "Failed to process chat request. Check server logs for details and verify your Gemini API configuration.",
      },
      { status: 500 }
    );
  }
}
