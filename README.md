# OpenObsidian

> Local-first knowledge management powered by DCMA cognitive engine.

OpenObsidian isn't just a notes app — it's a thinking tool. Your notes are indexed, connected, and reasoned about by **DCMA** — a graph cognition engine that detects relationships, contradictions, and patterns in your knowledge over time.

## Features

- **Markdown-native** — plain .md files, your data is portable
- **Full-text + semantic search** — find anything instantly
- **Knowledge graph** — powered by DCMA, interactive visualization of your connected ideas
- **AI insights** — DCMA detects conflicts, suggests links, surfaces forgotten knowledge
- **Knowledge chat** — DCMA answers questions from your notes with source citations
- **Dark-first design** — built for long writing sessions
- **Local-first** — no cloud accounts, no tracking, no servers. DCMA runs on your machine
- **Keyboard-driven** — Cmd+K search, Cmd+N new note, navigation without mouse

## Quick Start

```bash
npm install
npm run dev
# Open http://localhost:3000
```

Set your vault path in Settings to a folder containing .md files.

## Powered by DCMA

OpenObsidian works standalone with full-text search and knowledge graph visualization.
To unlock the full cognitive layer — conflict detection, link suggestions, semantic chat — you need **DCMA**.

**DCMA** is a private, proprietary cognitive reasoning engine built for understanding knowledge as a living graph. It was built by [Whilmar Bitoco](https://github.com/whilmarbitoco) as the intelligence layer behind OpenObsidian.

What DCMA does:
- Extracts entities and relationships from your notes, building a living knowledge graph
- Detects contradictions — when something you wrote today conflicts with a note from months ago
- Surfaces forgotten connections relevant to what you're currently thinking about
- Enables natural-language chat grounded in your own notes, with source citations

DCMA runs entirely on your machine. Your data never leaves your device.

To set it up, run DCMA locally and set its URL in OpenObsidian Settings (default: `http://localhost:3030`).

## Architecture

```
Browser → OpenObsidian (Next.js) → DCMA (cognitive engine)
                     ↓
              SQLite (search index)
```

DCMA is closed-source and proprietary. OpenObsidian is its public-facing product.
