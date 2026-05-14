import type { GraphData } from "@/types";

export type ContextCard = {
  id: string;
  label: string;
  title: string;
  summary: string;
  accent: string;
  categories?: string[];
  groupId?: string;
};

export type ContextDetail = ContextCard & {
  facts: Array<[string, string]>;
  recentNotes: string[];
};

export type ContextGroup = {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  contexts: ContextCard[];
};

// Personal Profile (top-level)
const TARUN_CONTEXT: ContextCard = {
  id: "tarun",
  label: "Person",
  title: "Tarun",
  summary:
    "CS&E undergrad, Accenture Databricks intern focused on AI/ML and data engineering.",
  accent: "#ddb7ff",
  categories: ["Personal Profile", "Student", "Internship", "AI / ML", "Data Engineering"],
  groupId: "profile",
};

// Internships
const INTERNSHIPS: ContextCard[] = [
  {
    id: "databricks",
    label: "Organization",
    title: "Accenture — Databricks Internship",
    summary: "Databricks platform work: Spark, Delta Lake, Unity Catalog, DLT, structured streaming.",
    accent: "#c0c1ff",
    categories: ["Internship", "Data Engineering"],
    groupId: "internships",
  },
  {
    id: "botcode",
    label: "Organization",
    title: "Botcode Technologies",
    summary: "Previous internship: speech-to-text pipelines, ASR and diarization work.",
    accent: "#c0c1ff",
    categories: ["Internship", "Speech-to-Text"],
    groupId: "internships",
  },
];

// Projects
const PROJECTS: ContextCard[] = [
  {
    id: "ai-travel-planner",
    label: "Project",
    title: "AI Travel Planner",
    summary: "Flagship deployed project: LLM orchestration with real-time travel APIs.",
    accent: "#b0b2ff",
    categories: ["Project", "LLM", "API Integration"],
    groupId: "projects",
  },
  {
    id: "speech-to-text",
    label: "Project",
    title: "Speech-to-Text with Diarization",
    summary: "Faster-Whisper + Pyannote diarization pipeline; Flask async architecture.",
    accent: "#b0b2ff",
    categories: ["Project", "ML Pipeline", "ASR"],
    groupId: "projects",
  },
  {
    id: "ecommerce-platform",
    label: "Project",
    title: "E-Commerce Full Stack",
    summary: "React/TS frontend, FastAPI backend, PostgreSQL, recommendation heuristics.",
    accent: "#b0b2ff",
    categories: ["Project", "Full-Stack"],
    groupId: "projects",
  },
  {
    id: "organ-transplant",
    label: "Project",
    title: "Organ Transplant Matching",
    summary: "Hackathon project: AI-assisted compatibility scoring and workflow logging.",
    accent: "#ddb7ff",
    categories: ["Project", "Hackathon", "Healthcare"],
    groupId: "projects",
  },
  {
    id: "brain-tumor",
    label: "Project",
    title: "Brain Tumor Classification",
    summary: "Classical ML pipeline: sklearn models, hyperparameter tuning, Streamlit demo.",
    accent: "#8f9194",
    categories: ["Project", "ML"],
    groupId: "projects",
  },
  {
    id: "cyberbullying",
    label: "Project",
    title: "Cyberbullying Detection",
    summary: "Flask + LSTM NLP pipeline for classification and demo deployment.",
    accent: "#b0b2ff",
    categories: ["Project", "NLP"],
    groupId: "projects",
  },
];

// Trips (empty for now, can be populated later)
const TRIPS: ContextCard[] = [];

// Health (empty for now, can be populated later)
const HEALTH: ContextCard[] = [];

// Daily Briefing (dynamic aggregation)
const DAILY_BRIEFING: ContextCard[] = [];

export const CONTEXTS: ContextCard[] = [
  TARUN_CONTEXT,
  ...INTERNSHIPS,
  ...PROJECTS,
  ...TRIPS,
  ...HEALTH,
  ...DAILY_BRIEFING,
];

export const CONTEXT_GROUPS: ContextGroup[] = [
  {
    id: "profile",
    title: "Personal Profile",
    description: "Your profile and identity",
    contexts: [TARUN_CONTEXT],
  },
  {
    id: "internships",
    title: "Internships",
    description: "Current and past internship roles",
    contexts: INTERNSHIPS,
  },
  {
    id: "projects",
    title: "Projects",
    description: "Active and completed projects",
    contexts: PROJECTS,
  },
  {
    id: "trips",
    title: "Trips",
    description: "Travel plans and experiences",
    contexts: TRIPS,
  },
  {
    id: "health",
    title: "Health",
    description: "Health and wellness tracking",
    contexts: HEALTH,
  },
  {
    id: "daily-briefing",
    title: "Daily Briefing",
    description: "Today's priorities and follow-ups",
    contexts: DAILY_BRIEFING,
  },
];

export const CONTEXT_DETAILS: Record<string, ContextDetail> = {
  tarun: {
    ...CONTEXTS.find((c) => c.id === "tarun")!,
    facts: [
      ["Career stage", "Accenture Databricks intern — student to industry-ready engineer"],
      ["Primary stack", "Python, PySpark, SQL, TypeScript"],
      ["Focus areas", "AI/ML, data engineering, backend systems"],
      ["Prior roles", "Botcode — speech-to-text internship"],
    ],
    recentNotes: [
      "Completing Databricks internship assessments and weekly MCQs.",
      "Maintaining active cyberbullying detection project for review.",
      "Building portfolio-facing projects with deployment focus.",
    ],
  },
  databricks: {
    ...CONTEXTS.find((c) => c.id === "databricks")!,
    facts: [
      ["Focus", "Spark, Delta Lake, Unity Catalog, DLT, Structured Streaming"],
      ["Current", "Internship work — weekly assessments and tasks"],
    ],
    recentNotes: [
      "Hands-on with Delta Live Tables and Auto Loader patterns.",
      "Working on assessment-driven tasks and competency checks.",
    ],
  },
  botcode: {
    ...CONTEXTS.find((c) => c.id === "botcode")!,
    facts: [
      ["Focus", "ASR pipelines, diarization, Flask APIs"],
      ["Outcome", "Speech-to-text pipeline used in internship work"],
    ],
    recentNotes: [
      "Speech-to-text pipeline architecture: Faster-Whisper + Pyannote.",
      "Diarization alignment and async Flask serving patterns.",
    ],
  },
  "ai-travel-planner": {
    ...CONTEXTS.find((c) => c.id === "ai-travel-planner")!,
    facts: [
      ["Stack", "Flask, Gemini LLM, Amadeus API, Vercel"],
      ["Status", "Deployed; conference presentation in 2025"],
    ],
    recentNotes: [
      "Hybrid LLM + live API orchestration; deployed demo used in talks.",
    ],
  },
  "speech-to-text": {
    ...CONTEXTS.find((c) => c.id === "speech-to-text")!,
    facts: [
      ["Stack", "Faster-Whisper, Pyannote, Flask async"],
      ["Focus", "Diarization accuracy and segmentation alignment"],
    ],
    recentNotes: [
      "Pipeline handles speaker segmentation and ASR alignment.",
    ],
  },
  "ecommerce-platform": {
    ...CONTEXTS.find((c) => c.id === "ecommerce-platform")!,
    facts: [
      ["Stack", "React/TypeScript, FastAPI, PostgreSQL"],
      ["Feature", "Jaccard-based recommendations, JWT auth"],
    ],
    recentNotes: [
      "Full-stack demo for portfolio; recommendation engine is heuristic-based.",
    ],
  },
  "organ-transplant": {
    ...CONTEXTS.find((c) => c.id === "organ-transplant")!,
    facts: [
      ["Format", "Hackathon project"],
      ["Focus", "AI-assisted compatibility scoring"],
    ],
    recentNotes: [
      "Rapid prototype with heuristic AI scoring for matches.",
    ],
  },
  "brain-tumor": {
    ...CONTEXTS.find((c) => c.id === "brain-tumor")!,
    facts: [
      ["Stack", "Scikit-learn, GridSearchCV, Streamlit"],
      ["Focus", "Classical ML pipeline and hyperparameter tuning"],
    ],
    recentNotes: [
      "Academic-style ML project with Streamlit demo.",
    ],
  },
  cyberbullying: {
    ...CONTEXTS.find((c) => c.id === "cyberbullying")!,
    facts: [
      ["Stack", "Flask, Keras LSTM"],
      ["Focus", "NLP classification pipeline for moderation"],
    ],
    recentNotes: [
      "Active project used for internship review and demos.",
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
      summary: "Python-first CS&E undergrad focused on AI/ML, backend systems, and data engineering.",
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
    {
      title: "Cyberbullying detection",
      summary: "Flask + Keras LSTM NLP classification pipeline for moderation and flagging.",
    },
  ],
  projects: [
    {
      title: "AI Travel Planner",
      summary: "Flask, Gemini LLM, Amadeus API integration, deployed with conference presentations.",
    },
    {
      title: "E-Commerce full stack platform",
      summary: "React, TypeScript, FastAPI, PostgreSQL, JWT auth, and Jaccard-based recommendations.",
    },
    {
      title: "Brain Tumor Classification",
      summary: "Scikit-learn, GridSearchCV hyperparameter tuning, and Streamlit demo.",
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
      "You have three strong lanes right now: data engineering at Accenture, applied AI projects like the travel planner and diarization pipeline, and the cyberbullying detection work. I can group those into a single context view.",
    contexts: ["Internship", "Projects", "Data Engineering", "AI / ML"],
  },
] satisfies Array<{ role: "user" | "assistant"; content: string; contexts?: string[] }>;

export const TARUN_GRAPH_DATA: GraphData = {
  nodes: [
    { id: "tarun", name: "Tarun", type: "PERSON", val: 9, color: "#ddb7ff" },
    { id: "databricks", name: "Databricks Internship", type: "ORGANIZATION", val: 8, color: "#c0c1ff" },
    { id: "botcode", name: "Botcode Technologies", type: "ORGANIZATION", val: 6, color: "#c0c1ff" },
    { id: "ai-travel-planner", name: "AI Travel Planner", type: "PROJECT", val: 8, color: "#b0b2ff" },
    { id: "speech-to-text", name: "Speech-to-Text", type: "PROJECT", val: 8, color: "#b0b2ff" },
    { id: "ecommerce-platform", name: "E-Commerce Platform", type: "PROJECT", val: 7, color: "#b0b2ff" },
    { id: "organ-transplant", name: "Organ Transplant Matching", type: "PROJECT", val: 6, color: "#ddb7ff" },
    { id: "brain-tumor", name: "Brain Tumor Classification", type: "PROJECT", val: 6, color: "#8f9194" },
    { id: "cyberbullying", name: "Cyberbullying Detection", type: "PROJECT", val: 7, color: "#b0b2ff" },
    { id: "data-engineering", name: "Data Engineering", type: "TOPIC", val: 5, color: "#8f9194" },
    { id: "ai-ml", name: "AI / ML", type: "TOPIC", val: 5, color: "#8f9194" },
    { id: "backend", name: "Backend Systems", type: "TOPIC", val: 5, color: "#8f9194" },
  ],
  links: [
    { source: "tarun", target: "databricks", label: "current internship" },
    { source: "tarun", target: "botcode", label: "prior internship" },
    { source: "tarun", target: "ai-travel-planner", label: "built" },
    { source: "tarun", target: "speech-to-text", label: "built" },
    { source: "tarun", target: "ecommerce-platform", label: "built" },
    { source: "tarun", target: "organ-transplant", label: "hackathon" },
    { source: "tarun", target: "brain-tumor", label: "built" },
    { source: "tarun", target: "cyberbullying", label: "active project" },
    { source: "databricks", target: "data-engineering", label: "focus" },
    { source: "botcode", target: "speech-to-text", label: "led to" },
    { source: "ai-travel-planner", target: "ai-ml", label: "uses" },
    { source: "speech-to-text", target: "ai-ml", label: "uses" },
    { source: "ecommerce-platform", target: "backend", label: "focus" },
    { source: "cyberbullying", target: "ai-ml", label: "uses" },
  ],
};