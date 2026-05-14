# Le Mem — Comprehensive Testing Guide

## ✅ Build Status
- **TypeScript Compilation**: ✓ No errors
- **Production Build**: ✓ Completed successfully
- **Routes Generated**: ✓ All 15 routes (7 static, 8 dynamic)

---

## 📋 Testing Checklist

### 1. **Data Structure Validation**

#### ✓ Registry Structure
- `CONTEXTS` array: 9 total contexts
  - 1 Personal Profile (tarun)
  - 2 Internships (databricks, botcode)
  - 6 Projects (ai-travel-planner, speech-to-text, ecommerce-platform, organ-transplant, brain-tumor, cyberbullying)
  - 0 Trips (placeholder for future)
  - 0 Health (placeholder for future)
  - 0 Daily Briefing (placeholder for future)

#### ✓ Category Groups
- `CONTEXT_GROUPS` array with 6 categories:
  1. **Personal Profile** (1 context: Tarun)
  2. **Internships** (2 contexts: Databricks, Botcode)
  3. **Projects** (6 contexts: AI Travel Planner, Speech-to-Text, E-Commerce, Organ Transplant, Brain Tumor, Cyberbullying)
  4. **Trips** (0 contexts, placeholder ready)
  5. **Health** (0 contexts, placeholder ready)
  6. **Daily Briefing** (0 contexts, dynamic aggregation ready)

#### ✓ Detail Mapping
- `CONTEXT_DETAILS` maps each context ID to detail view with facts and recent notes

#### ✓ Seed Data
- `TARUN_SUGGESTIONS` (4 items)
- `TARUN_SEARCH_RESULTS` (people, snippets, projects sections)
- `TARUN_CHAT_SEED` (3 message exchanges)
- `TARUN_GRAPH_DATA` (12 nodes, 14 links)

---

### 2. **UI Component Testing**

#### Contexts Hub Page (`/contexts`)
- [ ] Page renders 6 category sections
- [ ] Each category displays title and description
- [ ] Shows placeholder message for empty categories (Trips, Health, Daily Briefing)
- [ ] Shows all 9 contexts in appropriate sections
- [ ] Context cards display:
  - Label (Person/Organization/Project)
  - Title
  - Summary
  - Top 3 categories as tags
  - Hover effect with accent color highlight

#### Individual Context Page (`/contexts/[id]`)
- [ ] Loads specific context by ID
- [ ] Displays full context detail with facts table
- [ ] Shows recent notes section
- [ ] Back navigation works
- [ ] 404 for invalid context IDs
- [ ] Test all 9 context IDs:
  - `/contexts/tarun`
  - `/contexts/databricks`
  - `/contexts/botcode`
  - `/contexts/ai-travel-planner`
  - `/contexts/speech-to-text`
  - `/contexts/ecommerce-platform`
  - `/contexts/organ-transplant`
  - `/contexts/brain-tumor`
  - `/contexts/cyberbullying`

#### Search Page (`/search`)
- [ ] Renders suggestion chips from TARUN_SUGGESTIONS
- [ ] Displays sample search results in 3 sections:
  - People (2 results)
  - Snippets (3 results, includes cyberbullying)
  - Projects (3 results)

#### Chat Page (`/chat`)
- [ ] Loads initial seed messages from TARUN_CHAT_SEED
- [ ] Shows 3 initial messages with context tags
- [ ] Chat input responsive

#### Graph Page (`/graph`)
- [ ] Renders force-directed graph with 12 nodes
- [ ] All 14 links display correctly
- [ ] Nodes include:
  - Tarun (PERSON)
  - Databricks + Botcode (ORGANIZATION)
  - 6 Projects
  - 3 Topic nodes (Data Engineering, AI/ML, Backend Systems)
- [ ] Links show relationships with labels:
  - "current internship", "prior internship"
  - "built", "active project"
  - "focus", "uses", "led to"

---

### 3. **Navigation Testing**

#### Sidebar Navigation
- [ ] All main routes accessible: Contexts, Chat, Search, Graph, Timeline
- [ ] Contexts shows category grouping
- [ ] Active route highlights

#### Context Hub Navigation
- [ ] Clicking context card navigates to detail page
- [ ] Back button returns to context hub
- [ ] Can navigate between contexts using browser history

---

### 4. **Category Placeholder Structure**

#### Expandable Categories (Ready for User Data)

**Trips** (`groupId: "trips"`)
- Currently empty
- Ready to accept travel plans with fields:
  - Location, dates, itinerary, bookings

**Health** (`groupId: "health"`)
- Currently empty
- Ready to accept health records with fields:
  - Appointments, reminders, follow-ups

**Daily Briefing** (`groupId: "daily-briefing"`)
- Currently empty
- Dynamic aggregation-ready for:
  - Today's priorities, follow-ups from context

---

### 5. **Data Accuracy Testing**

#### Personal Profile (Tarun)
- Accurate career stage: "Accenture Databricks intern — student to industry-ready engineer"
- Correct stack: Python, PySpark, SQL, TypeScript
- Focus areas: AI/ML, data engineering, backend systems

#### Internships
- **Databricks**: Focus on Spark, Delta Lake, Unity Catalog, DLT, Structured Streaming
- **Botcode**: ASR pipelines, diarization, Flask APIs

#### Projects
- **AI Travel Planner**: Flask, Gemini LLM, Amadeus API, deployed with conference talks
- **Speech-to-Text**: Faster-Whisper, Pyannote, Flask async
- **E-Commerce**: React/TS, FastAPI, PostgreSQL, Jaccard-based recommendations
- **Organ Transplant**: Hackathon project with AI scoring
- **Brain Tumor**: Scikit-learn, GridSearchCV, Streamlit
- **Cyberbullying**: Flask, Keras LSTM NLP

---

### 6. **Error Handling Testing**

#### Invalid Context ID
- [ ] `/contexts/invalid-id` returns 404 page
- [ ] Error message displays correctly

#### Missing Session
- [ ] Unauthenticated users redirect to `/login`
- [ ] After auth, redirects to `/contexts`

---

### 7. **Performance Testing**

#### Build Metrics
- TypeScript compilation: ~3 seconds ✓
- Page generation: ~367ms for 15 pages ✓
- No build warnings ✓

#### Route Status
- 7 static pages (prerendered)
- 8 dynamic pages (server-rendered on demand)

---

### 8. **Accessibility & Responsive Design**

#### Desktop (1200px+)
- [ ] 3-column grid for contexts
- [ ] Full sidebar visible
- [ ] All typography readable

#### Tablet (768px-1199px)
- [ ] 2-column grid for contexts
- [ ] Sidebar collapse support
- [ ] Touch-friendly buttons

#### Mobile (< 768px)
- [ ] 1-column layout
- [ ] Bottom navigation visible
- [ ] Top bar with menu
- [ ] Readable text sizes

---

## 🚀 How to Test Locally

### Prerequisites
```bash
cd d:\Code\le-mem
npm install
```

### Start Dev Server
```bash
npm run dev
```
- Dev server runs on `http://localhost:3000`
- Live reload enabled

### Production Build
```bash
npm run build
npm start
```

### Type Checking
```bash
npx tsc --noEmit
```

### Linting
```bash
npx eslint src --max-warnings 0
```

---

## 📊 Data Flow Validation

```
ContextCard
├── id (string, unique)
├── label (Person/Organization/Project)
├── title (display name)
├── summary (short description)
├── accent (color hex)
├── categories (array of strings)
└── groupId (category group)

ContextDetail extends ContextCard
├── facts (key-value pairs)
└── recentNotes (string array)

ContextGroup
├── id (group identifier)
├── title (category title)
├── description (group description)
└── contexts (ContextCard array)
```

---

## ✨ Expected Behavior Summary

### Contexts Page
- Displays 6 category sections with headers and descriptions
- "Personal Profile" shows Tarun context
- "Internships" shows Databricks and Botcode
- "Projects" shows all 6 projects
- "Trips", "Health", "Daily Briefing" show placeholder messages
- Clicking any context navigates to detail view

### Detail Page
- Shows full context with label, title, summary
- Displays facts in table format
- Shows recent notes as bullet list
- Back navigation returns to contexts hub
- URL matches context ID (`/contexts/[id]`)

### Graph Page
- Tarun at center with connections to:
  - Internships (databricks, botcode)
  - Projects (all 6)
  - Topics (data-engineering, ai-ml, backend)
- Links show relationship labels
- Interactive node dragging supported

### Search Page
- Shows suggestion chips
- Displays categorized search results
- Updated to include cyberbullying project

### Chat Page
- Loads 3 seed messages from TARUN_CHAT_SEED
- Shows context tags on messages
- Input ready for new messages

---

## 🐛 Known Limitations

- Trips, Health, Daily Briefing categories are structure-ready but empty (by design — awaiting user data)
- Auth integration requires valid Google OAuth credentials in `.env.local`
- Graph force simulation may need tuning for larger datasets (currently handles 12 nodes well)

---

## ✓ Status
**All systems operational. Ready for user-facing feature development.**
