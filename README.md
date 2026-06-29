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

OpenObsidian works standalone with full-text search.
To enable AI insights, run the AI backend and set its URL in Settings.

## Architecture

```
Browser → OpenObsidian (Next.js) → AI Backend
                     ↓
              SQLite (search index)
```
