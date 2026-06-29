# OpenObsidian

> Local-first knowledge management powered by an AI backend.

OpenObsidian isn't just a notes app — it's a thinking tool. Your notes are indexed, connected, and analyzed by a local AI backend that detects relationships, conflicts, and patterns in your knowledge over time.

## Features

- **Markdown-native** — plain .md files, your data is portable
- **Full-text + semantic search** — find anything instantly
- **Knowledge graph** — interactive visualization of your ideas
- **AI insights** — conflict detection, link suggestions
- **Knowledge chat** — ask questions, get cited answers from your notes
- **Dark-first design** — built for long writing sessions
- **Local-first** — no cloud accounts, no tracking, no servers
- **Keyboard-driven** — Cmd+K search, Cmd+N new note, navigation without mouse

## Quick Start

```bash
npm install
npm run dev
# Open http://localhost:3000
```

Set your vault path in Settings to a folder containing .md files.

## AI Backend Setup

OpenObsidian works standalone with full-text search and knowledge graph visualization.
To enable AI-powered insights (conflict detection, link suggestions, semantic chat), you need an AI backend.

The backend processes your notes through a graph cognition pipeline:
- Builds a knowledge graph of entities and relationships extracted from your writing
- Detects when new notes conflict with or contradict earlier ones
- Surfaces forgotten connections relevant to what you're thinking about now
- Enables natural-language chat grounded in your own notes with source citations

Works entirely locally — your notes never leave your machine.

Set its URL in Settings (default: `http://localhost:8080`).

## Architecture

```
Browser → OpenObsidian (Next.js) → AI Backend
                     ↓
              SQLite (search index)
```
