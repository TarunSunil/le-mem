import type { EntityType } from "@/types";

export const NODE_COLORS: Record<EntityType, string> = {
  PERSON: "#e07a5f",
  PROJECT: "#2a9d8f",
  ORGANIZATION: "#f2cc8f",
  PLACE: "#b7b0a6",
  TRAVEL: "#f2cc8f",
  HEALTH: "#e07a5f",
  TOPIC: "#6f665a",
  EVENT: "#f2cc8f",
};

export const NODE_SIZE: Record<EntityType, number> = {
  PERSON: 8,
  PROJECT: 10,
  TOPIC: 5,
  ORGANIZATION: 7,
  PLACE: 6,
  TRAVEL: 6,
  HEALTH: 6,
  EVENT: 5,
};

export const ENTITY_LABELS: Record<EntityType, string> = {
  PERSON: "People",
  PLACE: "Places",
  PROJECT: "Projects",
  EVENT: "Events",
  HEALTH: "Health",
  TRAVEL: "Travel",
  TOPIC: "Topics",
  ORGANIZATION: "Organizations",
};

export const ENTITY_TYPE_ORDER: EntityType[] = [
  "PERSON",
  "PROJECT",
  "ORGANIZATION",
  "PLACE",
  "TRAVEL",
  "HEALTH",
  "EVENT",
  "TOPIC",
];
