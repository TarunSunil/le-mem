# FYI — Personal Memory OS

> An AI-powered personal knowledge system with semantic search, a tool-calling agent loop, RAG pipeline, and nightly memory consolidation. Your second brain, queryable in plain English.

[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=nextdotjs&labelColor=0f0f0f)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white&labelColor=0f0f0f)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-postgres-3ECF8E?style=flat-square&logo=supabase&logoColor=white&labelColor=0f0f0f)](https://supabase.com)
[![Gemini](https://img.shields.io/badge/Gemini-API-4285F4?style=flat-square&logo=google&logoColor=white&labelColor=0f0f0f)](https://deepmind.google/technologies/gemini/)
[![pgvector](https://img.shields.io/badge/pgvector-semantic_search-8A2BE2?style=flat-square&labelColor=0f0f0f)](https://github.com/pgvector/pgvector)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?style=flat-square&logo=vercel&labelColor=0f0f0f)](https://le-mem-inky.vercel.app)

**Live:** [le-mem-inky.vercel.app](https://le-mem-inky.vercel.app)

---

## What it is

FYI is a personal memory operating system — a place to store thoughts, notes, projects, and context, and then actually retrieve them intelligently. Unlike a notes app, FYI understands what you mean, not just what you typed.

Under the hood: a RAG pipeline that embeds every memory into a pgvector index, a Gemini-powered agent loop that can reason across multiple retrieval steps, and a nightly cron job that consolidates scattered entries into structured, searchable memories.

---

## How it works

### Ingestion
Write a memory in plain text. The app embeds it via Gemini's embedding API and stores both the raw text and the vector in Supabase (PostgreSQL + pgvector).

### Retrieval — RAG pipeline
When you ask a question, the agent:
1. Embeds the query
2. Runs a pgvector similarity search across your memory index
3. Injects the top-k relevant chunks into a Gemini context window
4. Returns a grounded, cited answer

### Agent loop
For complex queries, a tool-calling agent loop handles multi-step reasoning — it can retrieve, reflect, query again with refined terms, and synthesise an answer across multiple retrieval passes.

### Nightly consolidation
A cron job (cron-job.org → Vercel API route) runs nightly. It groups recent raw entries, asks Gemini to consolidate them into structured summaries, and writes the consolidated memories back to the index — improving long-term retrieval quality without manual curation.

---

## Architecture

```
FYI/
├── app/
│   ├── api/
│   │   ├── memories/       # CRUD: store, retrieve, delete memories
│   │   ├── agent/          # Tool-calling agent loop endpoint
│   │   ├── search/         # pgvector similarity search
│   │   └── cron/           # Nightly consolidation handler
│   ├── (chat)/             # Main query interface
│   └── (memories)/         # Memory browser + editor
├── lib/
│   ├── gemini.ts           # Gemini API client (embeddings + chat)
│   ├── supabase.ts         # Supabase client
│   ├── rag.ts              # RAG pipeline: embed → search → inject → generate
│   └── agent.ts            # Multi-step agent loop with tool definitions
├── prisma/
│   └── schema.prisma       # DB schema (Memory, Embedding, Session)
└── supabase/
    └── migrations/         # pgvector setup, index creation
```

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| AI model | Google Gemini (chat + embeddings) |
| Vector store | pgvector on Supabase PostgreSQL |
| ORM | Prisma |
| Auth | Next-Auth (session persistence) |
| Deployment | Vercel |
| Cron | cron-job.org → Vercel API route |

---

## Local setup

```bash
git clone https://github.com/TarunSunil/le-mem.git
cd le-mem
npm install
```

Create `.env.local`:

```env
GEMINI_API_KEY=your_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=your_postgres_connection_string
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000
```

Run Prisma migrations and start:

```bash
npx prisma migrate dev
npm run dev
```

Open [localhost:3000](http://localhost:3000).

---

## Notes

- The production stack uses **Gemini**, not OpenAI — despite early specs referencing GPT-4o.
- The Service Worker is configured to intercept navigation only for offline shell routes; API routes bypass it entirely.
- Memory streaming uses Gemini's streaming response API with newline sanitisation on the client.
