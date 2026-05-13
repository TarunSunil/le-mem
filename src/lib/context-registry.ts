import type { GraphData } from "@/types";

export type ContextCard = {
  id: string;
  label: string;
  title: string;
  summary: string;
  accent: string;
  categories?: string[];
};

export type ContextDetail = ContextCard & {
  facts: Array<[string, string]>;
  recentNotes: string[];
};

export const CONTEXTS: ContextCard[] = [
  {
    id: "tarun",
    label: "Person",
    title: "Tarun",
    summary:
      "CS&E undergrad in India, Python-first builder, and Databricks intern focused on AI engineering, backend systems, and data workflows.",
    accent: "#ddb7ff",
    categories: ["Personal Profile", "Student", "Builder", "AI / ML", "Backend", "Data Engineering", "Internship"],
  },
  {
    id: "tokyo-trip",
    label: "Travel",
    title: "Tokyo Trip",
    summary: "Flights, hotel, restaurants, and the airport transfer notes.",
    accent: "#b0b2ff",
    categories: ["Travel", "Planning", "Bookings"],
  },
  {
    id: "le-mem",
    label: "Project",
    title: "Le Mem",
    summary: "Product polish, auth flow, graph visualization, and retrieval work.",
    accent: "#c0c1ff",
    categories: ["Project", "Product", "Retrieval"],
  },
  {
    id: "health",
    label: "Health",
    title: "Health",
    summary: "Dentist reminder, appointment details, and follow-up insurance note.",
    accent: "#8f9194",
    categories: ["Health", "Reminder", "Follow-up"],
  },
  {
    id: "daily-briefing",
    label: "Topic",
    title: "Daily Briefing",
    summary: "Morning prep, priority review, and the next set of follow-ups.",
    accent: "#b0b2ff",
    categories: ["Daily", "Planning", "Review"],
  },
  {
    id: "design-review",
    label: "Event",
    title: "Design Review",
    summary: "Meeting notes, action items, and the linked memory trail.",
    accent: "#ddb7ff",
    categories: ["Meeting", "Action Items", "Review"],
  },
];

export const CONTEXT_DETAILS: Record<string, ContextDetail> = {
  tarun: {
    ...CONTEXTS[0],
    facts: [
      ["Career stage", "Student to industry-ready engineer"],
      ["Primary stack", "Python, SQL, TypeScript, PySpark"],
      ["Focus areas", "AI/ML, backend, data engineering"],
      ["Internship", "Accenture Databricks intern"],
    ],
    recentNotes: [
      "Builds deployable AI products with a practical backend and data layer.",
      "Prefers direct, structured, high-signal responses and visual explanations.",
      "Uses AI as a planning, debugging, and memory layer.",
    ],
  },
  "tokyo-trip": {
    ...CONTEXTS[1],
    facts: [
      ["Trip stage", "Planning"],
      ["Primary focus", "Flights, stays, and transport"],
      ["Useful memories", "Itinerary, food ideas, booking details"],
      ["Status", "Active"],
    ],
    recentNotes: [
      "Review the return flight option and airport transfer timing.",
      "Check hotel and restaurant shortlist before finalizing.",
      "Keep itinerary notes grouped by day for fast lookup.",
    ],
  },
  "le-mem": {
    ...CONTEXTS[2],
    facts: [
      ["Role", "Personal Memory OS"],
      ["Stack", "Next.js, Prisma, PostgreSQL"],
      ["Focus areas", "Auth, graph, retrieval, chat"],
      ["Status", "In progress"],
    ],
    recentNotes: [
      "Improve entity linking and retrieval relevance.",
      "Keep the UI polished but grounded in real memory data.",
      "Use the project as the main system for organizing context.",
    ],
  },
  health: {
    ...CONTEXTS[3],
    facts: [
      ["Category", "Wellness follow-up"],
      ["Reminder type", "Appointment"],
      ["Next action", "Insurance or visit follow-up"],
      ["Status", "Active"],
    ],
    recentNotes: [
      "Confirm the dentist appointment window.",
      "Keep the insurance note attached for the follow-up.",
      "Mark the reminder so it resurfaces before the visit.",
    ],
  },
  "daily-briefing": {
    ...CONTEXTS[4],
    facts: [
      ["Mode", "Morning planning"],
      ["Primary use", "Priority review"],
      ["Linked notes", "Tasks, deadlines, and follow-ups"],
      ["Status", "Recurring"],
    ],
    recentNotes: [
      "Capture the top tasks before the day starts.",
      "Surface only the most important follow-ups.",
      "Use this as a fast review layer, not a long dump.",
    ],
  },
  "design-review": {
    ...CONTEXTS[5],
    facts: [
      ["Format", "Meeting"],
      ["Primary output", "Action items"],
      ["Value", "Links design decisions to memory trail"],
      ["Status", "Archived"],
    ],
    recentNotes: [
      "Track decisions alongside follow-up tasks.",
      "Link the review to any related project changes.",
      "Keep the action list short and visible.",
    ],
  },
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
    { id: "tarun", name: "Tarun", type: "PERSON", val: 8, color: "#ddb7ff" },
    { id: "databricks", name: "Databricks Internship", type: "ORGANIZATION", val: 7, color: "#c0c1ff" },
    { id: "ai-travel-planner", name: "AI Travel Planner", type: "PROJECT", val: 8, color: "#b0b2ff" },
    { id: "speech-to-text", name: "Speech-to-Text", type: "PROJECT", val: 8, color: "#b0b2ff" },
    { id: "ecommerce-platform", name: "E-Commerce Platform", type: "PROJECT", val: 7, color: "#b0b2ff" },
    { id: "backend", name: "Backend", type: "TOPIC", val: 5, color: "#8f9194" },
    { id: "data-engineering", name: "Data Engineering", type: "TOPIC", val: 5, color: "#8f9194" },
    { id: "ai-ml", name: "AI / ML", type: "TOPIC", val: 5, color: "#8f9194" },
  ],
  links: [
    { source: "tarun", target: "databricks", label: "internship" },
    { source: "tarun", target: "ai-travel-planner", label: "built" },
    { source: "tarun", target: "speech-to-text", label: "built" },
    { source: "tarun", target: "ecommerce-platform", label: "built" },
    { source: "databricks", target: "data-engineering", label: "focus area" },
    { source: "ai-travel-planner", target: "ai-ml", label: "uses" },
    { source: "speech-to-text", target: "ai-ml", label: "uses" },
    { source: "ecommerce-platform", target: "backend", label: "uses" },
  ],
};