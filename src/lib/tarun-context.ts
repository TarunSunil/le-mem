import type { GraphData } from "@/types";

export const TARUN_CONTEXT_ID = "tarun";

export const TARUN_PROFILE = {
  id: TARUN_CONTEXT_ID,
  label: "Person",
  title: "Tarun",
  summary:
    "CS&E undergrad in India, Python-first builder, and Databricks intern focused on AI engineering, backend systems, and data workflows.",
  categories: ["Personal Profile", "Student", "Builder", "AI / ML", "Backend", "Data Engineering", "Internship"],
  facts: [
    ["Career stage", "Student to industry-ready engineer"],
    ["Primary stack", "Python, SQL, TypeScript, PySpark"],
    ["Focus areas", "AI/ML, backend, data engineering"],
    ["Internship", "Accenture Databricks intern"],
  ] as Array<[string, string]>,
  recentNotes: [
    "Builds deployable AI products with a practical backend and data layer.",
    "Prefers direct, structured, high-signal responses and visual explanations.",
    "Uses AI as a planning, debugging, and memory layer.",
  ],
};

export const TARUN_SUGGESTIONS = [
  "What do I know about Tarun?",
  "Summarize my Databricks internship",
  "Find the AI travel planner notes",
  "Show follow-ups from this week",
];

export const TARUN_SEARCH_RESULTS = {
  people: [
    {
      name: "Tarun",
      summary: "Python-first CS&E undergrad focused on AI engineering, backend systems, and data workflows.",
    },
    {
      name: "Accenture Databricks intern",
      summary: "Weekly assessments, Spark, Delta Lake, Unity Catalog, and structured streaming work.",
    },
  ],
  snippets: [
    {
      title: "Speech-to-text with diarization",
      summary: "Faster-Whisper, Pyannote, and Flask pipelines for speaker-aware transcription.",
    },
    {
      title: "AI travel planner",
      summary: "Gemini and Amadeus orchestration for travel planning with real-time API integration.",
    },
  ],
  projects: [
    {
      title: "E-Commerce full stack platform",
      summary: "React, TypeScript, FastAPI, PostgreSQL, JWT auth, and recommendation workflows.",
    },
    {
      title: "Le Mem",
      summary: "Auth, chat surface, context hub, graph visualization, and retrieval polish are linked here.",
    },
  ],
};

export const TARUN_CHAT_SEED = [
  {
    role: "assistant" as const,
    content:
      "I pulled together your Databricks internship notes, the speech-to-text project, and the AI travel planner. Want me to turn them into a timeline or a context page?",
    contexts: ["Tarun", "Databricks", "AI / ML"],
  },
  {
    role: "user" as const,
    content:
      "Summarize what happened across my internship, AI projects, and anything I should follow up on this week.",
  },
  {
    role: "assistant" as const,
    content:
      "You have three strong lanes right now: data engineering at Accenture, applied AI projects like the travel planner and diarization pipeline, and the Le Mem product work. I can group those into a single context view.",
    contexts: ["Internship", "Projects", "Data Engineering"],
  },
] satisfies Array<{ role: "user" | "assistant"; content: string; contexts?: string[] }>;

export const TARUN_GRAPH_DATA: GraphData = {
  nodes: [
    { id: TARUN_CONTEXT_ID, name: "Tarun", type: "PERSON", val: 8, color: "#ddb7ff" },
    { id: "databricks", name: "Databricks Internship", type: "ORGANIZATION", val: 7, color: "#c0c1ff" },
    { id: "ai-travel-planner", name: "AI Travel Planner", type: "PROJECT", val: 8, color: "#b0b2ff" },
    { id: "speech-to-text", name: "Speech-to-Text", type: "PROJECT", val: 8, color: "#b0b2ff" },
    { id: "ecommerce-platform", name: "E-Commerce Platform", type: "PROJECT", val: 7, color: "#b0b2ff" },
    { id: "backend", name: "Backend", type: "TOPIC", val: 5, color: "#8f9194" },
    { id: "data-engineering", name: "Data Engineering", type: "TOPIC", val: 5, color: "#8f9194" },
    { id: "ai-ml", name: "AI / ML", type: "TOPIC", val: 5, color: "#8f9194" },
  ],
  links: [
    { source: TARUN_CONTEXT_ID, target: "databricks", label: "internship" },
    { source: TARUN_CONTEXT_ID, target: "ai-travel-planner", label: "built" },
    { source: TARUN_CONTEXT_ID, target: "speech-to-text", label: "built" },
    { source: TARUN_CONTEXT_ID, target: "ecommerce-platform", label: "built" },
    { source: "databricks", target: "data-engineering", label: "focus area" },
    { source: "ai-travel-planner", target: "ai-ml", label: "uses" },
    { source: "speech-to-text", target: "ai-ml", label: "uses" },
    { source: "ecommerce-platform", target: "backend", label: "uses" },
  ],
};