# OpenObsidian — Complete Build Specification (All Phases)

## What It Is
A local-first personal knowledge management web app powered by a cognitive reasoning engine. Users write notes in markdown, and the app intelligently links, recalls, and reasons about their knowledge over time.

**Tagline:** "Your notes think with you."

## Core Philosophy
- Local-first: data lives on the user's machine (or their git repo), never on our servers
- Cognitive layer: not just storage and search, but *understanding* — relationships, contradictions, evolution
- Markdown-native: plain `.md` files, portable, future-proof

## Tech Stack
- **Framework:** Next.js 15 (App Router, TypeScript) — ALREADY SCAFFOLDED
- **Styling:** Tailwind CSS v4 + shadcn/ui components — ALREADY SCAFFOLLED
- **Editor:** CodeMirror 6 for markdown editing with live preview — ALREADY SCAFFOLLED
- **Search:** Full-text search using SQLite FTS5 + semantic search via DCMA
- **Graph visualization:** D3 force-directed graph
- **Database:** better-sqlite3 for metadata, indexes, settings
- **AI Backend:** Talks to DCMA at localhost:3030 (cognitive reasoning engine)
- **State:** Zustand for client state
- **Markdown processing:** remark + rehype ecosystem
- **Icons:** lucide-react

## Current Status (Phase 1 Complete)
- ✅ Next.js 15 project initialized at /opt/data/openobsidian/
- ✅ shadcn/ui configured with dark theme
- ✅ Vault management (API routes for folder, read/write .md files)
- ✅ Dashboard page with file tree sidebar
- ✅ Note editor: CodeMirror 6 + live preview
- ✅ Routes: /dashboard, /note/[id], /graph, /search, /insights, /settings
- ✅ DB layer, Zustand store, markdown lib

## Phases To Build

### Phase 2 — Search & Graph Visualization

**Full-text search:**
- Build FTS5 index in SQLite over all note content
- Search API: `/api/search?q=query` returns ranked results with snippets
- Search page UI: search bar + results list with highlighted matches
- Reindex on note save/delete (debounced, runs in background)

**Knowledge graph:**
- Parse `[[wikilinks]]` and `#tags` from markdown content
- Graph data API: `/api/graph` returns `{ nodes: [{id, title, tags, updatedAt}], edges: [{source, target, type}] }`
- Graph view page: D3 force-directed graph
  - Nodes sized by number of connections (degree)
  - Color by tag or recency
  - Click node → open note
  - Drag nodes to rearrange
  - Zoom/pan
  - Hover → tooltip with note preview (first 100 chars)
  - Filter by tag dropdown
  - Search highlight in graph (matching nodes glow)

### Phase 3 — Cognitive Layer (DCMA Integration)

**API proxy to DCMA at localhost:3030:**
- All `/api/insights/*` routes proxy to DCMA
- Show connection status indicator in header (connected/disconnected dot)
- Graceful degradation: if DCMA unreachable, show basic insights only

**Insights panel (/insights route):**
- "Recently modified" — last 10 notes changed
- "Untagged notes" — notes with no #tags
- "Orphan notes" — notes with no [[wikilinks]] in or out
- "Suggested links" — DCMA proposes connections between unlinked notes
- "Contradictions" — surfaces DCMA's findings with side-by-side note comparison

**AI chat panel:**
- Floating chat button → slide-out panel
- Send message → POST to DCMA /api/chat
- Display response with citations (clickable note references)
- Chat history persisted in localStorage

### Phase 4 — Polish & Quality

**Keyboard shortcuts:**
- `Cmd+K` — Command palette (fuzzy search notes, go to page)
- `Cmd+N` — New note
- `Cmd+S` — Save (auto-save is default but manual too)
- `Cmd+/` — Toggle sidebar
- `Esc` — Close panels

**Settings page:**
- Vault path (text input + "Browse" — stored in localStorage)
- Theme toggle (dark/light)
- DCMA endpoint URL (default: http://localhost:3030)
- "Test Connection" button for DCMA
- Index stats: total notes, total links, last reindex time

**UI polish:**
- Dark theme refinement: deep navy bg (#0a0a0f), warm amber accents (#f59e0b), muted text
- Loading skeletons for all async operations
- Empty states with helpful text + icons
- Subtle transitions (fade-in panels, hover effects)
- Responsive: sidebar auto-collapses < 768px
- Toast notifications for save/delete/link actions (sonner)

**Tests (Vitest, real SQLite in-memory):**
- `vault.test.ts` — file read/write, directory listing, .md detection
- `search.test.ts` — FTS5 indexing, ranking, snippets
- `graph.test.ts` — wikilink extraction, tag extraction, edge building
- `markdown.test.ts` — remark/rehype processing, wikilink parsing

## README.md Must Contain:

```markdown
# OpenObsidian

> Local-first knowledge management powered by cognitive reasoning.

OpenObsidian isn't just a notes app — it's a thinking tool. Your notes are 
 indexed, connected, and reasoned about by a cognitive engine that detects 
 relationships, contradictions, and patterns in your knowledge over time.

## The Cognitive Layer

OpenObsidian runs on DCMA (private), a cognitive reasoning engine that:
- **Extracts entities** from your writing automatically
- **Builds a knowledge graph** of connected ideas
- **Detects contradictions** when new notes conflict with old ones
- **Surfaces forgotten connections** relevant to what you're writing now

## Features

- 📝 **Markdown-native** — plain .md files, your data is portable
- � **Full-text + semantic search** — find anything instantly
- �️ **Knowledge graph** — interactive visualization of your ideas
- � **AI insights** — contradiction detection, link suggestions
- 💬 **Knowledge chat** — ask questions, get cited answers from your notes
- 🌙 **Dark-first design** — built for long writing sessions
- 🔒 **Local-first** — no cloud accounts, no tracking, no servers
- �️ **Keyboard-driven** — Cmd+K search, Cmd+N new note, navigation without mouse

## Quick Start

\`\`\`bash
npm install
npm run dev
# Open http://localhost:3000
\`\`\`

Set your vault path in Settings to a folder containing .md files.

## Cognitive Engine Setup

OpenObsidian works standalone with full-text search.
To enable AI insights, run DCMA at localhost:3030.

## Architecture

\`\`\`
Browser → OpenObsidian (Next.js) → DCMA (localhost:3030)
                     ↓
              SQLite (search index)
\`\`\`
```

## Non-Goals (Do NOT Build)
- Real-time collaboration
- Cloud sync (user manages their own)
- Mobile native app
- Plugin system
- WYSIWYG editor

## Code Quality Rules
- TypeScript strict mode — zero `any` types
- Vitest tests with real SQLite in-memory (NO @patch/MagicMock)
- shadcn/ui component composition (never custom CSS for what shadcn provides)
- Server Components by default — "use client" only for interactivity
- Path alias @/ → src/
- Clean file naming: kebab-case for files, PascalCase for components

## IMPORTANT BUILD NOTES
1. Never pipe stdin to opencode
2. Check what already exists before creating — Phase 1 is done
3. Run `npx tsc --noEmit` after each phase to catch type errors
4. Keep the dev server running — build incrementally
5. Use `npx shadcn@latest add X` for any new UI components needed
6. For the graph, use d3 directly (not a React wrapper) with useRef + useEffect
