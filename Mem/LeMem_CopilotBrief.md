# FYI — Personal Context OS · GitHub Copilot Vibe Coding Brief

Paste this entire document into your VS Code GitHub Copilot Chat to scaffold the project.

---

## What we're building

FYI is an AI-powered personal memory OS. The user talks to it like a WhatsApp self-chat. The AI automatically extracts entities (people, places, projects, events), builds a knowledge graph in the background, and lets the user retrieve anything through natural language — not keywords.

Core screens already designed in Tailwind HTML:
- **Omni-Chat** — primary input, dump anything (text, voice, images, PDFs)
- **Context Hub** — auto-generated wiki pages for people / projects / travel / health
- **Knowledge Graph** — interactive force-graph of entity relationships
- **Memory Timeline** — chronological feed of all memories
- **Smart Retrieval** — semantic search interface

---

## Tech stack (final decision)

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 App Router + TypeScript | Full-stack in one repo, RSC, API routes, great Copilot autocomplete |
| Styling | Tailwind CSS + shadcn/ui | Existing HTML designs use Tailwind; shadcn for headless base components |
| Auth | NextAuth.js v5 | Google OAuth + session management |
| Database | Supabase (Postgres + pgvector) | One platform for DB + vector search + storage + realtime |
| ORM | Prisma | Type-safe queries, migrations, schema as code |
| AI / LLM | OpenAI API (GPT-4o + text-embedding-3-small) | Entity extraction, summarization, embeddings |
| RAG pipeline | LangChain.js | Memory chain, retrieval, context building |
| File uploads | Uploadthing | Images, PDFs, audio — direct to Supabase Storage |
| Graph visualization | react-force-graph-2d | Interactive knowledge graph canvas |
| Animations | Framer Motion | Page transitions and node animations |
| Deployment | Vercel | One-click from GitHub, edge functions |

---

## Project structure

```
le-mem/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   ├── (main)/
│   │   ├── layout.tsx            ← shell with sidebar + bottom nav
│   │   ├── chat/
│   │   │   └── page.tsx          ← Omni-Chat screen (primary)
│   │   ├── contexts/
│   │   │   ├── page.tsx          ← Context Hub listing
│   │   │   └── [id]/
│   │   │       └── page.tsx      ← Individual context page (person/project/trip/health)
│   │   ├── graph/
│   │   │   └── page.tsx          ← Knowledge Graph (react-force-graph)
│   │   ├── timeline/
│   │   │   └── page.tsx          ← Memory Timeline
│   │   └── search/
│   │       └── page.tsx          ← Smart Retrieval
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts          ← POST: send message, trigger entity extraction
│   │   ├── memory/
│   │   │   ├── ingest/
│   │   │   │   └── route.ts      ← POST: ingest content, embed, extract entities
│   │   │   ├── search/
│   │   │   │   └── route.ts      ← POST: semantic search via pgvector
│   │   │   └── summary/
│   │   │       └── route.ts      ← GET: weekly/project summaries
│   │   ├── graph/
│   │   │   └── route.ts          ← GET: entity nodes + edges for graph view
│   │   └── upload/
│   │       └── route.ts          ← Uploadthing file handler
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── ui/                       ← shadcn/ui base components (auto-generated)
│   ├── chat/
│   │   ├── ChatInput.tsx         ← textarea + mic + attach buttons
│   │   ├── MessageBubble.tsx     ← user and AI message variants
│   │   ├── ContextChip.tsx       ← auto-tagged context labels on messages
│   │   └── SuggestionChips.tsx   ← quick-action chips above input
│   ├── context-hub/
│   │   ├── ContextCard.tsx       ← card for people/projects/trips
│   │   ├── PersonPage.tsx        ← person context hub layout
│   │   ├── ProjectPage.tsx       ← project context hub layout
│   │   ├── TravelPage.tsx        ← travel context hub layout
│   │   └── HealthPage.tsx        ← health context hub layout
│   ├── graph/
│   │   ├── KnowledgeGraph.tsx    ← react-force-graph-2d wrapper
│   │   ├── NodeTooltip.tsx       ← hover tooltip on graph nodes
│   │   └── GraphFilters.tsx      ← filter by entity type
│   ├── timeline/
│   │   ├── TimelineItem.tsx      ← memory card (text/image/link/context-update variants)
│   │   └── DayGroup.tsx          ← date grouping header
│   ├── search/
│   │   ├── SearchInput.tsx       ← semantic search bar
│   │   ├── SearchResult.tsx      ← result card (entity/snippet/project)
│   │   └── SuggestedQueries.tsx  ← pre-built bento query suggestions
│   └── layout/
│       ├── Sidebar.tsx           ← desktop navigation drawer
│       ├── BottomNav.tsx         ← mobile bottom nav bar
│       └── TopBar.tsx            ← mobile top app bar
├── lib/
│   ├── ai/
│   │   ├── extract-entities.ts   ← GPT-4o call to extract people/places/events/topics
│   │   ├── embed.ts              ← text-embedding-3-small wrapper
│   │   ├── summarize.ts          ← summarization prompts
│   │   └── rag-chain.ts          ← LangChain retrieval chain
│   ├── db/
│   │   ├── prisma.ts             ← Prisma client singleton
│   │   └── queries/
│   │       ├── memories.ts       ← memory CRUD
│   │       ├── entities.ts       ← entity CRUD
│   │       └── graph.ts          ← relationship queries
│   ├── supabase/
│   │   └── client.ts             ← Supabase client (browser + server)
│   └── utils/
│       ├── format-date.ts
│       └── classify-content.ts   ← detect if input is text/image/link/audio
├── prisma/
│   └── schema.prisma             ← full schema (see below)
├── types/
│   └── index.ts                  ← shared TypeScript types
├── tailwind.config.ts            ← with FYI design tokens
└── .env.local
```

---

## Prisma schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  image     String?
  createdAt DateTime @default(now())
  memories  Memory[]
  entities  Entity[]
}

model Memory {
  id          String      @id @default(cuid())
  userId      String
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  content     String
  rawInput    String
  contentType ContentType @default(TEXT)
  embedding   Unsupported("vector(1536)")?
  summary     String?
  tags        String[]
  fileUrl     String?
  sourceUrl   String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  entities    MemoryEntity[]
  
  @@index([userId, createdAt])
}

model Entity {
  id          String     @id @default(cuid())
  userId      String
  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  name        String
  type        EntityType
  summary     String?
  attributes  Json       @default("{}")
  embedding   Unsupported("vector(1536)")?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  
  memories    MemoryEntity[]
  
  // self-referential for relationships (Arjun → Google)
  fromRelations EntityRelation[] @relation("FromEntity")
  toRelations   EntityRelation[] @relation("ToEntity")
  
  @@unique([userId, name, type])
  @@index([userId, type])
}

model EntityRelation {
  id           String   @id @default(cuid())
  fromEntityId String
  toEntityId   String
  label        String   // e.g. "works at", "mentioned in", "related to"
  strength     Float    @default(1.0)
  
  fromEntity Entity @relation("FromEntity", fields: [fromEntityId], references: [id], onDelete: Cascade)
  toEntity   Entity @relation("ToEntity", fields: [toEntityId], references: [id], onDelete: Cascade)
  
  @@unique([fromEntityId, toEntityId, label])
}

model MemoryEntity {
  memoryId String
  entityId String
  
  memory Memory @relation(fields: [memoryId], references: [id], onDelete: Cascade)
  entity Entity @relation(fields: [entityId], references: [id], onDelete: Cascade)
  
  @@id([memoryId, entityId])
}

enum ContentType {
  TEXT
  IMAGE
  AUDIO
  PDF
  LINK
  CONTEXT_UPDATE
}

enum EntityType {
  PERSON
  PLACE
  PROJECT
  EVENT
  HEALTH
  TRAVEL
  TOPIC
  ORGANIZATION
}
```

---

## Tailwind config with FYI design tokens

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // --- FYI design tokens (from original HTML designs) ---
        "surface":                  "#131313",
        "surface-container":        "#201f1f",
        "surface-container-low":    "#1c1b1b",
        "surface-container-high":   "#2a2a2a",
        "surface-container-highest":"#353534",
        "surface-variant":          "#353534",
        "surface-dim":              "#131313",
        "surface-bright":           "#393939",
        "on-surface":               "#e5e2e1",
        "on-surface-variant":       "#c5c7c9",
        "background":               "#131313",
        "on-background":            "#e5e2e1",
        "primary":                  "#ffffff",
        "on-primary":               "#2f3132",
        "primary-container":        "#e2e2e4",
        "primary-fixed":            "#e2e2e4",
        "primary-fixed-dim":        "#c6c6c8",
        "on-primary-fixed":         "#1a1c1d",
        "on-primary-fixed-variant": "#454749",
        "on-primary-container":     "#636466",
        "inverse-primary":          "#5d5e60",
        "surface-tint":             "#c6c6c8",
        "secondary":                "#c0c1ff",
        "on-secondary":             "#1000a9",
        "secondary-container":      "#3131c0",
        "on-secondary-container":   "#b0b2ff",
        "secondary-fixed":          "#e1e0ff",
        "secondary-fixed-dim":      "#c0c1ff",
        "on-secondary-fixed":       "#07006c",
        "on-secondary-fixed-variant":"#2f2ebe",
        "tertiary":                 "#ffffff",
        "on-tertiary":              "#490080",
        "tertiary-container":       "#f0dbff",
        "on-tertiary-container":    "#8a33d9",
        "tertiary-fixed":           "#f0dbff",
        "tertiary-fixed-dim":       "#ddb7ff",
        "on-tertiary-fixed":        "#2c0051",
        "on-tertiary-fixed-variant":"#6900b3",
        "outline":                  "#8f9194",
        "outline-variant":          "#44474a",
        "error":                    "#ffb4ab",
        "on-error":                 "#690005",
        "error-container":          "#93000a",
        "on-error-container":       "#ffdad6",
        "inverse-surface":          "#e5e2e1",
        "inverse-on-surface":       "#313030",
      },
      borderRadius: {
        DEFAULT: "1rem",
        lg: "2rem",
        xl: "3rem",
        full: "9999px",
      },
      spacing: {
        "unit": "4px",
        "safe-area": "32px",
        "container-padding": "24px",
        "section-margin": "40px",
        "element-gap": "16px",
      },
      fontFamily: {
        serif: ["Newsreader", "serif"],
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## Environment variables (.env.local)

```env
# Database
DATABASE_URL="postgresql://..."        # Supabase pooled connection string
DIRECT_URL="postgresql://..."          # Supabase direct connection string (for migrations)

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# OpenAI
OPENAI_API_KEY="sk-..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Uploadthing
UPLOADTHING_SECRET="..."
UPLOADTHING_APP_ID="..."
```

---

## Key API routes to build first

### 1. Memory ingestion — `POST /api/memory/ingest`

```
Input:  { content: string, contentType: ContentType, fileUrl?: string }
Steps:
  1. Generate embedding (text-embedding-3-small)
  2. Call GPT-4o to extract entities JSON
     → { people: [], places: [], projects: [], topics: [], events: [] }
  3. Upsert each entity into Entity table
  4. Insert Memory row with embedding
  5. Create MemoryEntity join rows
  6. Upsert EntityRelation rows (e.g. person → organization)
Output: { memoryId, entitiesFound: Entity[] }
```

### 2. Semantic search — `POST /api/memory/search`

```
Input:  { query: string, limit?: number }
Steps:
  1. Embed the query
  2. Run pgvector similarity search:
     SELECT *, embedding <=> $query_embedding AS distance
     FROM "Memory"
     WHERE "userId" = $userId
     ORDER BY distance ASC
     LIMIT 10
  3. Also search Entity table with same embedding
  4. Return merged results grouped by type
Output: { memories: Memory[], entities: Entity[], projects: Context[] }
```

### 3. Chat — `POST /api/chat`

```
Input:  { messages: Message[], currentMemoryId?: string }
Steps:
  1. Retrieve relevant memories via RAG chain
  2. Build system prompt with context
  3. Stream GPT-4o response
  4. After response: ingest the user message as a new Memory
Output: Streamed text response (use Vercel AI SDK useChat)
```

### 4. Knowledge graph — `GET /api/graph`

```
Steps:
  1. Query all Entity rows for user
  2. Query all EntityRelation rows
  3. Format for react-force-graph-2d:
     { nodes: [{ id, name, type, val }], links: [{ source, target, label }] }
Output: { nodes, links }
```

---

## Entity extraction prompt (GPT-4o system prompt)

```
You are an entity extraction engine for a personal memory OS.

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
- Return raw JSON only
```

---

## Knowledge graph node colors by entity type

```ts
// components/graph/KnowledgeGraph.tsx
const NODE_COLORS: Record<EntityType, string> = {
  PERSON:       "#ddb7ff", // tertiary-fixed-dim (purple)
  PROJECT:      "#b0b2ff", // on-secondary-container (indigo)
  ORGANIZATION: "#c0c1ff", // secondary
  PLACE:        "#c5c7c9", // on-surface-variant
  TRAVEL:       "#c6c6c8", // surface-tint
  HEALTH:       "#ddb7ff",
  TOPIC:        "#8f9194", // outline
  EVENT:        "#b0b2ff",
};

const NODE_SIZE: Record<EntityType, number> = {
  PERSON:       8,
  PROJECT:      10,
  TOPIC:        5,
  ORGANIZATION: 7,
  PLACE:        6,
  TRAVEL:       6,
  HEALTH:       6,
  EVENT:        5,
};
```

---

## Build order (recommended)

1. **Scaffold** — `npx create-next-app@latest le-mem --typescript --tailwind --app`
2. **Design system** — copy Tailwind tokens, add Google Fonts (Inter + Newsreader), install shadcn/ui
3. **Auth** — NextAuth with Google OAuth, protect all `(main)` routes
4. **Database** — Supabase project, enable pgvector extension, push Prisma schema
5. **Shell** — Sidebar, BottomNav, TopBar components (mobile + desktop)
6. **Chat screen** — static UI first, then wire up the `/api/chat` streaming route
7. **Ingestion pipeline** — `/api/memory/ingest` with entity extraction
8. **Timeline** — render Memory rows from DB sorted by createdAt desc
9. **Context pages** — group entities by type, render auto-generated wiki pages
10. **Semantic search** — pgvector cosine similarity, search UI
11. **Knowledge graph** — react-force-graph-2d, nodes from Entity table, edges from EntityRelation
12. **Polish** — Framer Motion transitions, mobile gestures, suggestion chips

---

## Install commands

```bash
npx create-next-app@latest le-mem --typescript --tailwind --app --src-dir --import-alias "@/*"
cd le-mem

# shadcn/ui
npx shadcn@latest init

# Core dependencies
npm install @prisma/client prisma
npm install @supabase/supabase-js
npm install next-auth@beta
npm install openai
npm install langchain @langchain/openai
npm install react-force-graph-2d
npm install framer-motion
npm install uploadthing @uploadthing/react
npm install @ai-sdk/openai ai   # Vercel AI SDK for streaming chat
npm install date-fns             # date formatting
npm install zustand              # lightweight state management

# Dev
npm install -D @types/node
npx prisma init
```

---

## Design notes from existing HTML screens

- Background: `#0A0A0A` (deeper than `surface` token — use as page bg)
- Glass panels: `bg-surface/60 backdrop-blur-3xl border border-white/10`
- User message bubble: `bg-surface-container-high/80 rounded-2xl rounded-tr-sm`
- AI message bubble: `bg-surface/80 backdrop-blur-sm border border-white/5 rounded-2xl rounded-tl-sm`
- Context tags on messages: `bg-surface/50 border border-secondary-container/30 text-secondary-container rounded-full`
- Active nav item: `bg-tertiary-container text-on-tertiary rounded-full` (mobile) or `bg-secondary-container text-on-secondary-container rounded-full` (desktop)
- Ambient orbs: `radial-gradient` blobs with `rgba(49,49,192,0.15)` (indigo) and `rgba(138,51,217,0.1)` (violet), `filter: blur(80px)`, `opacity: 0.15`, `position: fixed`, `z-index: -1`
- Input area gradient: `bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/90 to-transparent`
- Send button active state: `bg-secondary-container text-on-secondary-container`
- Entity processing chip: `bg-surface-container-high/80 border border-white/10 rounded-full` with pulsing dot
- All icons: Material Symbols Outlined (`https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1`)
- Font: Inter (body) + Newsreader (headlines/display)

---

## Copilot prompts to get started (run these in sequence)

```
1. "Scaffold the Next.js App Router shell with Sidebar, BottomNav, and TopBar 
  components matching the FYI dark design system. Use the Tailwind tokens 
   from the config above. The sidebar should show on md+ screens, 
   bottom nav on mobile only."

2. "Build the ChatInput component with a growing textarea, mic button, 
   attach button, and send button. The send button should show a pulse 
   animation when idle and turn solid on active. Add SuggestionChips 
   above the input bar."

3. "Create the /api/memory/ingest route that takes content and contentType, 
   calls OpenAI text-embedding-3-small to embed it, then calls GPT-4o with 
   the entity extraction system prompt, and saves to Prisma."

4. "Build the KnowledgeGraph component using react-force-graph-2d. 
   Fetch nodes and links from /api/graph. Color nodes by EntityType 
   using the NODE_COLORS map. Make nodes clickable to open the context page."

5. "Create the Smart Retrieval page with a semantic search input. 
   On submit, POST to /api/memory/search, then render results grouped 
   into People, Message Snippets, and Project Contexts sections."
```
