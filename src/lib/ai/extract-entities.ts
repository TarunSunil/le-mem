// src/lib/ai/extract-entities.ts
import { OpenAI } from "openai";
import { ExtractedEntities } from "@/types";

const apiKey = process.env.OPENAI_API_KEY;
const client = apiKey ? new OpenAI({ apiKey }) : null;

const EXTRACTION_PROMPT = `You are an entity extraction engine for a personal memory OS.

Given a piece of text, extract all named entities and return ONLY a JSON object — no prose, no markdown.

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
- Return raw JSON only`;

export async function extractEntities(
  text: string
): Promise<ExtractedEntities> {
  try {
    if (!client) {
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

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: EXTRACTION_PROMPT,
        },
        {
          role: "user",
          content: text,
        },
      ],
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content || "{}";
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
