// src/types/index.ts

export type ContentType = 
  | "TEXT" 
  | "IMAGE" 
  | "AUDIO" 
  | "PDF" 
  | "LINK" 
  | "CONTEXT_UPDATE";

export type EntityType = 
  | "PERSON" 
  | "PLACE" 
  | "PROJECT" 
  | "EVENT" 
  | "HEALTH" 
  | "TRAVEL" 
  | "TOPIC" 
  | "ORGANIZATION";

export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  createdAt: Date;
}

export interface Memory {
  id: string;
  userId: string;
  content: string;
  rawInput: string;
  contentType: ContentType;
  embedding?: number[];
  summary?: string;
  tags: string[];
  fileUrl?: string;
  sourceUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  entities?: MemoryEntity[];
}

export interface Entity {
  id: string;
  userId: string;
  name: string;
  type: EntityType;
  summary?: string;
  attributes: Record<string, unknown>;
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
  memories?: MemoryEntity[];
  fromRelations?: EntityRelation[];
  toRelations?: EntityRelation[];
}

export interface EntityRelation {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  label: string;
  strength: number;
  fromEntity?: Entity;
  toEntity?: Entity;
}

export interface MemoryEntity {
  memoryId: string;
  entityId: string;
  memory?: Memory;
  entity?: Entity;
}

export interface ExtractedEntities {
  people: Array<{ name: string; relationship?: string; context?: string }>;
  organizations: Array<{ name: string; type?: string }>;
  places: Array<{ name: string; type?: "city" | "venue" | "country" | "address" }>;
  projects: Array<{ name: string; status?: "active" | "planned" | "completed" }>;
  topics: Array<{ name: string }>;
  events: Array<{ name: string; date?: string }>;
  relationships: Array<{ from: string; to: string; label: string }>;
}

export interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: Date;
  entityChips?: Entity[];
}

export interface GraphNode {
  id: string;
  name: string;
  type: EntityType;
  val: number;
  color?: string;
}

export interface GraphLink {
  source: string;
  target: string;
  label: string;
  strength?: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface SearchResult {
  memories: Memory[];
  entities: Entity[];
  contexts?: Entity[];
}
