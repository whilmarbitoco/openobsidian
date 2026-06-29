import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import type { Note } from "@/types"
import {
  reindexNote,
  upsertNoteMetadata,
  removeNoteFromIndex,
  removeNoteMetadata,
} from "@/lib/db"

function parseNote(filePath: string): Note {
  const content = fs.readFileSync(filePath, "utf-8")
  const stats = fs.statSync(filePath)
  const title = extractTitle(content)
  const tags = extractTags(content)
  const links = extractWikilinks(content)

  return {
    id: encodeURIComponent(filePath),
    title,
    content,
    path: filePath,
    createdAt: stats.birthtime.toISOString(),
    updatedAt: stats.mtime.toISOString(),
    tags,
    links,
  }
}

function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m)
  if (match) return match[1].trim()
  const firstLine = content.split("\n")[0]?.trim()
  if (firstLine) return firstLine.slice(0, 60)
  return "Untitled"
}

function extractTags(content: string): string[] {
  const regex = /#([a-zA-Z0-9_-]+)/g
  const tags: string[] = []
  let match: RegExpExecArray | null
  while ((match = regex.exec(content)) !== null) {
    tags.push(match[1].toLowerCase())
  }
  return [...new Set(tags)]
}

function extractWikilinks(content: string): string[] {
  const regex = /\[\[([^\]]+)\]\]/g
  const links: string[] = []
  let match: RegExpExecArray | null
  while ((match = regex.exec(content)) !== null) {
    links.push(match[1].trim())
  }
  return links
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const notePath = searchParams.get("path")

    if (notePath) {
      const absolutePath = path.resolve(notePath)
      if (!fs.existsSync(absolutePath)) {
        return NextResponse.json(
          { error: "Note not found" },
          { status: 404 }
        )
      }
      const note = parseNote(absolutePath)
      return NextResponse.json(note)
    }

    const vaultPath = searchParams.get("vaultPath")
    if (!vaultPath) {
      return NextResponse.json(
        { error: "vaultPath parameter required" },
        { status: 400 }
      )
    }

    const notes: Note[] = []
    const absoluteVault = path.resolve(vaultPath)
    if (fs.existsSync(absoluteVault)) {
      collectNotes(absoluteVault, notes)
    }

    for (const note of notes) {
      reindexNote(note.path, note.title, note.content)
      upsertNoteMetadata(note.path, note.title, note.tags, note.links)
    }

    return NextResponse.json(notes)
  } catch (error) {
    console.error("Notes error:", error)
    return NextResponse.json(
      { error: "Failed to read notes" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { path: notePath, title } = body

    if (!notePath) {
      return NextResponse.json(
        { error: "Path is required" },
        { status: 400 }
      )
    }

    const dirPath = path.dirname(notePath)
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }

    const fileName = title
      ? `${title.replace(/[^a-zA-Z0-9-_]/g, "-")}.md`
      : `note-${Date.now()}.md`
    const filePath = path.join(notePath, fileName)

    if (fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "Note already exists" },
        { status: 409 }
      )
    }

    const content = `# ${title || "Untitled"}\n\n`
    fs.writeFileSync(filePath, content, "utf-8")

    const note = parseNote(filePath)
    reindexNote(note.path, note.title, note.content)
    upsertNoteMetadata(note.path, note.title, note.tags, note.links)
    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error("Create note error:", error)
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { path: notePath, content } = body

    if (!notePath) {
      return NextResponse.json(
        { error: "Path is required" },
        { status: 400 }
      )
    }

    const absolutePath = path.resolve(notePath)
    fs.writeFileSync(absolutePath, content, "utf-8")

    const note = parseNote(absolutePath)
    reindexNote(note.path, note.title, note.content)
    upsertNoteMetadata(note.path, note.title, note.tags, note.links)
    return NextResponse.json(note)
  } catch (error) {
    console.error("Save note error:", error)
    return NextResponse.json(
      { error: "Failed to save note" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const notePath = searchParams.get("path")

    if (!notePath) {
      return NextResponse.json(
        { error: "Path is required" },
        { status: 400 }
      )
    }

    const absolutePath = path.resolve(notePath)
    fs.unlinkSync(absolutePath)
    removeNoteFromIndex(absolutePath)
    removeNoteMetadata(absolutePath)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete note error:", error)
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 }
    )
  }
}

function collectNotes(dirPath: string, notes: Note[]) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue
      const fullPath = path.join(dirPath, entry.name)
      if (entry.isDirectory()) {
        collectNotes(fullPath, notes)
      } else if (entry.name.endsWith(".md")) {
        notes.push(parseNote(fullPath))
      }
    }
  } catch {
    // skip unreadable directories
  }
}
