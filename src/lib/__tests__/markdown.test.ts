import { describe, it, expect } from "vitest"
import { extractTitle, extractWikilinks, extractTags } from "@/lib/markdown"

describe("extractTitle", () => {
  it("extracts title from H1 heading", () => {
    expect(extractTitle("# My Title\n\nContent")).toBe("My Title")
  })

  it("returns first line if no heading", () => {
    expect(extractTitle("Just a line\n\nMore content")).toBe("Just a line")
  })

  it("returns Untitled for empty content", () => {
    expect(extractTitle("")).toBe("Untitled")
  })

  it("handles heading with trailing spaces", () => {
    expect(extractTitle("#   Spaced Title   \n\nContent")).toBe("Spaced Title")
  })

  it("prefers H1 over other content", () => {
    expect(extractTitle("First line\n# Actual Title\nMore")).toBe("Actual Title")
  })
})

describe("extractWikilinks", () => {
  it("extracts single wikilink", () => {
    expect(extractWikilinks("See [[Note Name]] for details")).toEqual([
      "Note Name",
    ])
  })

  it("extracts multiple wikilinks", () => {
    expect(
      extractWikilinks("[[Note A]] and [[Note B]] are linked")
    ).toEqual(["Note A", "Note B"])
  })

  it("returns empty array for text without wikilinks", () => {
    expect(extractWikilinks("No links here")).toEqual([])
  })

  it("handles nested brackets in wikilinks", () => {
    expect(extractWikilinks("[[Project Alpha]]")).toEqual(["Project Alpha"])
  })

  it("trims whitespace from link targets", () => {
    expect(extractWikilinks("[[  My Note  ]]")).toEqual(["My Note"])
  })

  it("handles wikilinks with display text", () => {
    const result = extractWikilinks("[[target|display]]")
    expect(result).toEqual(["target|display"])
  })
})

describe("extractTags", () => {
  it("extracts a single tag", () => {
    expect(extractTags("This is #important")).toEqual(["important"])
  })

  it("extracts multiple tags", () => {
    expect(extractTags("#programming #typescript #docs")).toEqual([
      "programming",
      "typescript",
      "docs",
    ])
  })

  it("deduplicates tags", () => {
    expect(extractTags("#tag #tag #tag")).toEqual(["tag"])
  })

  it("normalizes tags to lowercase", () => {
    expect(extractTags("#TypeScript #TYPESCRIPT")).toEqual(["typescript"])
  })

  it("handles tags with hyphens and underscores", () => {
    expect(extractTags("#my-tag #another_tag")).toEqual([
      "my-tag",
      "another_tag",
    ])
  })

  it("returns empty array for text without tags", () => {
    expect(extractTags("No tags here")).toEqual([])
  })

  it("does not include hashtags in headings as tags", () => {
    expect(extractTags("# Heading\n\nSome #tag")).toEqual(["tag"])
  })

  it("handles tags adjacent to punctuation", () => {
    expect(extractTags("Check #tag, and #another.")).toEqual(["tag", "another"])
  })
})
