// src/lib/ai/extract-entities.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ExtractedEntities } from "@/types";
import { withGeminiFallback } from "./gemini-fallback";

const EXTRACTION_PROMPT = `You are an entity extraction engine for a personal memory OS.

Given a piece of text, extract all named entities and return ONLY a JSON object — no prose, no markdown formatting, no code blocks like \`\`\`json.

Schema:
{
  "people": [{ "name": string, "relationship"?: string, "context"?: string }],
  "organizations": [{ "name": string, "type"?: string }],
  "places": [{ "name": string, "type"?: "city"|"venue"|"country"|"address" }],
  "projects": [{ "name": string, "status"?: "active"|"planned"|"completed" }],
  "topics": [{ "name": string }],
  "events": [{ "name": string, "date"?: string }],
  "relationships": [{ "from": string, "to": string, "label": string }]
}

Rules:
- Only extract entities that are explicitly mentioned
- "relationships" maps entity names to each other (e.g. { from: "Arjun", to: "Google", label: "works at" })
- Return empty arrays for missing categories, never null
- Return raw JSON only, starting with { and ending with }`;

export async function extractEntities(
  text: string
): Promise<ExtractedEntities> {
  try {
    return await withGeminiFallback(async (genAI) => {
      const model = genAI.getGenerativeModel({
        model: process.env.EXTRACTION_MODEL ?? "gemini-1.5-flash",
      });

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text }] }],
        systemInstruction: EXTRACTION_PROMPT,
        generationConfig: {
          temperature: 0.3,
        },
      });

      let content = result.response.text();
      // Clean up potential markdown formatting
      content = content.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
      const parsed = JSON.parse(content);

      return {
        people: parsed.people || [],
        organizations: parsed.organizations || [],
        places: parsed.places || [],
        projects: parsed.projects || [],
        topics: parsed.topics || [],
        events: parsed.events || [],
        relationships: parsed.relationships || [],
      };
    });
  } catch (error) {
    console.error("Entity extraction failed:", error);
    return {
      people: [],
      organizations: [],
      places: [],
      projects: [],
      topics: [],
      events: [],
      relationships: [],
    };
  }
}
