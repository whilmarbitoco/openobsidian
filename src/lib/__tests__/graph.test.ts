import { describe, it, expect, beforeEach, afterEach } from "vitest"
import Database from "better-sqlite3"
import type { GraphNode, GraphEdge } from "@/types"

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
  `)
})

afterEach(() => {
  db.close()
})

function addNote(
  path: string,
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
  ).run(path, title, JSON.stringify(tags), JSON.stringify(links))
}

function getGraphData(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const rows = db
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

describe("graph data", () => {
  it("returns empty graph when no notes exist", () => {
    const { nodes, edges } = getGraphData()
    expect(nodes).toHaveLength(0)
    expect(edges).toHaveLength(0)
  })

  it("creates a node for each note", () => {
    addNote("/notes/a.md", "Note A", [], [])
    addNote("/notes/b.md", "Note B", [], [])
    const { nodes } = getGraphData()
    expect(nodes).toHaveLength(2)
  })

  it("creates edges for wikilinks", () => {
    addNote("/notes/a.md", "Note A", [], ["Note B"])
    addNote("/notes/b.md", "Note B", [], ["Note A"])
    const { edges } = getGraphData()
    expect(edges).toHaveLength(2)
    expect(edges[0].type).toBe("wikilink")
  })

  it("calculates degree (incoming + outgoing links)", () => {
    addNote("/notes/a.md", "Note A", [], ["Note B", "Note C"])
    addNote("/notes/b.md", "Note B", [], ["Note A"])
    addNote("/notes/c.md", "Note C", [], [])
    const { nodes } = getGraphData()

    const nodeA = nodes.find((n) => n.title === "Note A")
    const nodeB = nodes.find((n) => n.title === "Note B")
    const nodeC = nodes.find((n) => n.title === "Note C")

    expect(nodeA?.degree).toBe(3)
    expect(nodeB?.degree).toBe(2)
    expect(nodeC?.degree).toBe(1)
  })

  it("stores tags on nodes", () => {
    addNote("/notes/a.md", "Note A", ["programming", "go"], [])
    const { nodes } = getGraphData()
    expect(nodes[0].tags).toEqual(["programming", "go"])
  })

  it("handles notes with no wikilinks", () => {
    addNote("/notes/orphan.md", "Orphan Note", [], [])
    const { nodes, edges } = getGraphData()
    expect(nodes).toHaveLength(1)
    expect(edges).toHaveLength(0)
    expect(nodes[0].degree).toBe(0)
  })

  it("works with wikilinks to non-existent notes", () => {
    addNote("/notes/a.md", "Note A", [], ["NonExistent"])
    const { nodes, edges } = getGraphData()
    expect(nodes).toHaveLength(1)
    expect(edges).toHaveLength(1)
  })
})
