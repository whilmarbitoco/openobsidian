import { describe, it, expect, beforeEach, afterEach } from "vitest"
import Database from "better-sqlite3"
import type { SearchResult } from "@/types"

interface NoteRow {
  path: string
  title: string
  snippet: string
  rank: number
}

let db: Database.Database

beforeEach(() => {
  db = new Database(":memory:")
  db.pragma("journal_mode = WAL")
  db.exec(`
    CREATE TABLE IF NOT EXISTS note_metadata (
      path TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT 'Untitled',
      tags TEXT DEFAULT '[]',
      links TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS note_fts USING fts5(
      path UNINDEXED,
      title,
      content,
      tokenize='porter unicode61'
    );
  `)
})

afterEach(() => {
  db.close()
})

function reindexNote(notePath: string, title: string, content: string) {
  db.prepare("DELETE FROM note_fts WHERE path = ?").run(notePath)
  db.prepare("INSERT INTO note_fts (path, title, content) VALUES (?, ?, ?)").run(
    notePath,
    title,
    content
  )
}

function upsertNoteMetadata(
  notePath: string,
  title: string,
  tags: string[],
  links: string[]
) {
  db.prepare(
    `INSERT INTO note_metadata (path, title, tags, links, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'))
     ON CONFLICT(path) DO UPDATE SET
       title = excluded.title,
       tags = excluded.tags,
       links = excluded.links,
       updated_at = datetime('now')`
  ).run(notePath, title, JSON.stringify(tags), JSON.stringify(links))
}

function searchNotes(query: string): SearchResult[] {
  const rows = db
    .prepare(
      `SELECT
        nf.path,
        nf.title,
        snippet(note_fts, 2, '<mark>', '</mark>', '...', 40) as snippet,
        rank
       FROM note_fts nf
       WHERE note_fts MATCH ?
       ORDER BY rank
       LIMIT 50`
    )
    .all(query) as NoteRow[]

  return rows.map((row) => {
    const meta = db
      .prepare("SELECT tags, updated_at FROM note_metadata WHERE path = ?")
      .get(row.path) as { tags: string; updated_at: string } | undefined

    return {
      path: row.path,
      title: row.title,
      snippet: row.snippet,
      rank: row.rank,
      tags: meta ? JSON.parse(meta.tags) : [],
      updatedAt: meta ? meta.updated_at : "",
    }
  })
}

describe("search (FTS5)", () => {
  beforeEach(() => {
    reindexNote("/notes/go.md", "Go Language", "Go is a compiled language #programming")
    reindexNote("/notes/python.md", "Python Programming", "Python is an interpreted language #programming")
    reindexNote("/notes/typescript.md", "TypeScript", "TypeScript is a typed superset of JavaScript that compiles to plain JavaScript #programming #typescript")
    reindexNote("/notes/cooking.md", "Cooking Pasta", "How to cook pasta al dente. #cooking")
    upsertNoteMetadata("/notes/go.md", "Go Language", ["programming"], [])
    upsertNoteMetadata("/notes/python.md", "Python Programming", ["programming"], [])
    upsertNoteMetadata("/notes/typescript.md", "TypeScript", ["programming", "typescript"], [])
    upsertNoteMetadata("/notes/cooking.md", "Cooking Pasta", ["cooking"], [])
  })

  it("returns results matching a query", () => {
    const results = searchNotes('"language"')
    expect(results.length).toBeGreaterThan(0)
    expect(results.some((r) => r.path.includes("python"))).toBe(true)
  })

  it("returns empty array for non-matching query", () => {
    const results = searchNotes('"zzzznotexist"')
    expect(results).toHaveLength(0)
  })

  it("ranks results by relevance", () => {
    reindexNote("/notes/programming-guide.md", "Programming Guide", "A guide about programming languages including Go, Python, and TypeScript")
    upsertNoteMetadata("/notes/programming-guide.md", "Programming Guide", ["programming"], [])
    const results = searchNotes('"programming"')
    expect(results.length).toBeGreaterThan(0)
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].rank).toBeLessThanOrEqual(results[i].rank)
    }
  })

  it("generates snippets with highlighted terms", () => {
    const results = searchNotes('"compiled"')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].snippet).toContain("<mark>")
  })

  it("handles prefix wildcard queries", () => {
    const results = searchNotes('"typ"*')
    expect(results.some((r) => r.path.includes("typescript"))).toBe(true)
  })

  it("returns tags in search results", () => {
    const results = searchNotes('"TypeScript"')
    expect(results.length).toBeGreaterThan(0)
    const ts = results.find((r) => r.path.includes("typescript"))
    expect(ts?.tags).toContain("typescript")
  })

  it("returns updated timestamp", () => {
    const results = searchNotes('"Go"')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].updatedAt).toBeTruthy()
  })

  it("limits results to 50", () => {
    for (let i = 0; i < 60; i++) {
      const p = `/notes/note-${i}.md`
      reindexNote(p, `Note ${i}`, `This is note number ${i} about programming`)
      upsertNoteMetadata(p, `Note ${i}`, ["programming"], [])
    }
    const results = searchNotes('"programming"')
    expect(results.length).toBeLessThanOrEqual(50)
  })
})
