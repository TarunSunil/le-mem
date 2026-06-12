export const TOOL_DECLARATIONS = [
  {
    name: "query_memory",
    description:
      "Semantic search over the user's personal memory store. Use this for anything about the user's own life: projects, people, preferences, past events, health, travel.",
    parameters: {
      type: "OBJECT",
      properties: {
        query: { type: "STRING", description: "Natural language search query" },
        limit: { type: "NUMBER", description: "Max results (default 10)" },
      },
      required: ["query"],
    },
  },
  {
    name: "create_note",
    description:
      "Save new information into the user's memory store. Use only when the user explicitly says to remember, save, or note something.",
    parameters: {
      type: "OBJECT",
      properties: {
        content: { type: "STRING", description: "The content to save" },
      },
      required: ["content"],
    },
  },
  {
    name: "search_web",
    description:
      "Search the web for current information not in the user's memory: recent events, facts, definitions, anything needing up-to-date data.",
    parameters: {
      type: "OBJECT",
      properties: {
        query: { type: "STRING", description: "Web search query" },
      },
      required: ["query"],
    },
  },
] as const;

export type ToolName = (typeof TOOL_DECLARATIONS)[number]["name"];