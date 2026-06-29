import { describe, it, expect, beforeEach, afterEach } from "vitest"
import fs from "fs"
import path from "path"
import os from "os"

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

function scanMdFiles(dir: string): string[] {
  const results: string[] = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...scanMdFiles(fullPath))
    } else if (entry.name.endsWith(".md")) {
      results.push(fullPath)
    }
  }
  return results
}

let testDir: string

beforeEach(() => {
  testDir = fs.mkdtempSync(path.join(os.tmpdir(), "vault-test-"))
})

afterEach(() => {
  fs.rmSync(testDir, { recursive: true, force: true })
})

describe("vault file operations", () => {
  it("detects .md files", () => {
    fs.writeFileSync(path.join(testDir, "note1.md"), "# Note 1")
    fs.writeFileSync(path.join(testDir, "note2.md"), "# Note 2")
    const files = scanMdFiles(testDir)
    expect(files).toHaveLength(2)
    expect(files.every((f) => f.endsWith(".md"))).toBe(true)
  })

  it("excludes non-markdown files", () => {
    fs.writeFileSync(path.join(testDir, "note.md"), "# Note")
    fs.writeFileSync(path.join(testDir, "readme.txt"), "readme")
    fs.writeFileSync(path.join(testDir, "script.js"), "console.log()")
    const files = scanMdFiles(testDir)
    expect(files).toHaveLength(1)
  })

  it("skips hidden files and directories", () => {
    fs.writeFileSync(path.join(testDir, "note.md"), "# Note")
    fs.mkdirSync(path.join(testDir, ".hidden"))
    fs.writeFileSync(path.join(testDir, ".hidden", "secret.md"), "# secret")
    const files = scanMdFiles(testDir)
    expect(files).toHaveLength(1)
  })

  it("recursively finds .md files in subdirectories", () => {
    fs.mkdirSync(path.join(testDir, "sub1"))
    fs.mkdirSync(path.join(testDir, "sub1", "sub2"))
    fs.writeFileSync(path.join(testDir, "root.md"), "# Root")
    fs.writeFileSync(path.join(testDir, "sub1", "note.md"), "# Sub 1")
    fs.writeFileSync(path.join(testDir, "sub1", "sub2", "deep.md"), "# Deep")
    const files = scanMdFiles(testDir)
    expect(files).toHaveLength(3)
  })

  it("reads a file and extracts its title", () => {
    const content = "# My Awesome Note\n\nSome content here."
    fs.writeFileSync(path.join(testDir, "note.md"), content)
    const readContent = fs.readFileSync(path.join(testDir, "note.md"), "utf-8")
    expect(extractTitle(readContent)).toBe("My Awesome Note")
  })

  it("writes content to a file", () => {
    const content = "# New Note\n\nFresh content."
    const filePath = path.join(testDir, "new.md")
    fs.writeFileSync(filePath, content, "utf-8")
    const readBack = fs.readFileSync(filePath, "utf-8")
    expect(readBack).toBe(content)
  })

  it("returns Untitled for a file with no heading", () => {
    const content = "Just a plain text file without headings."
    expect(extractTitle(content)).toBe("Just a plain text file without headings.")
  })

  it("returns Untitled for empty content", () => {
    expect(extractTitle("")).toBe("Untitled")
  })
})
