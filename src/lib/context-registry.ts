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

// All content now comes from user-created memories and APIs.
export const CONTEXTS: ContextCard[] = [];
export const CONTEXT_GROUPS: ContextGroup[] = [];
export const CONTEXT_DETAILS: Record<string, ContextDetail> = {};

export const TARUN_SUGGESTIONS: string[] = [];
export const TARUN_SEARCH_RESULTS = {
  people: [],
  snippets: [],
  projects: [],
};

export const TARUN_CHAT_SEED: Array<{
  role: "user" | "assistant";
  content: string;
  contexts?: string[];
}> = [];

export const TARUN_GRAPH_DATA: GraphData = {
  nodes: [],
  links: [],
};
