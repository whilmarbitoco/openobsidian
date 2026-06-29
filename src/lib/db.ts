import Database from "better-sqlite3"
import path from "path"
import fs from "fs"
import type { SearchResult, GraphNode, GraphEdge } from "@/types"

let db: Database.Database | null = null

function getDbPath(): string {
  const dataDir = path.join(process.cwd(), ".openobsidian")
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  return path.join(dataDir, "metadata.db")
}

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(getDbPath())
    db.pragma("journal_mode = WAL")
    initializeSchema()
  }
  return db
}

function initializeSchema() {
  db!.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

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
}

export function closeDb() {
  if (db) {
    db.close()
    db = null
  }
}

export function reindexNote(notePath: string, title: string, content: string) {
  const database = getDb()
  database.prepare("DELETE FROM note_fts WHERE path = ?").run(notePath)
  database
    .prepare("INSERT INTO note_fts (path, title, content) VALUES (?, ?, ?)")
    .run(notePath, title, content)
}

export function upsertNoteMetadata(
  notePath: string,
  title: string,
  tags: string[],
  links: string[]
) {
  const database = getDb()
  database
    .prepare(
      `INSERT INTO note_metadata (path, title, tags, links, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))
       ON CONFLICT(path) DO UPDATE SET
         title = excluded.title,
         tags = excluded.tags,
         links = excluded.links,
         updated_at = datetime('now')`
    )
    .run(notePath, title, JSON.stringify(tags), JSON.stringify(links))
}

export function removeNoteMetadata(notePath: string) {
  const database = getDb()
  database.prepare("DELETE FROM note_metadata WHERE path = ?").run(notePath)
}

export function removeNoteFromIndex(notePath: string) {
  const database = getDb()
  database.prepare("DELETE FROM note_fts WHERE path = ?").run(notePath)
}

export function searchNotes(query: string): SearchResult[] {
  const database = getDb()
  const rows = database
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
    .all(query) as {
    path: string
    title: string
    snippet: string
    rank: number
  }[]

  return rows.map((row) => {
    const meta = database
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

export function getGraphData(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const database = getDb()

  const rows = database
    .prepare("SELECT path, title, tags, links, updated_at FROM note_metadata")
    .all() as {
    path: string
    title: string
    tags: string
    links: string
    updated_at: string
  }[]

  const linkTargets = new Map<string, number>()

  for (const row of rows) {
    const links: string[] = JSON.parse(row.links)
    for (const target of links) {
      linkTargets.set(target, (linkTargets.get(target) || 0) + 1)
    }
  }

  const nodeMap = new Map<string, GraphNode>()
  const edges: GraphEdge[] = []

  for (const row of rows) {
    const parsedTags: string[] = JSON.parse(row.tags)
    const parsedLinks: string[] = JSON.parse(row.links)
    const id = row.path

    const incoming = linkTargets.get(row.title) || 0
    const outgoing = parsedLinks.length
    const degree = incoming + outgoing

    nodeMap.set(id, {
      id,
      title: row.title,
      tags: parsedTags,
      updatedAt: row.updated_at,
      degree,
    })

    for (const target of parsedLinks) {
      edges.push({ source: id, target, type: "wikilink" })
    }
  }

  return { nodes: Array.from(nodeMap.values()), edges }
}
