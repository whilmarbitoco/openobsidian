import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import rehypeSanitize from "rehype-sanitize"
import rehypeHighlight from "rehype-highlight"

export async function renderMarkdown(content: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(rehypeRaw)
    .use(rehypeSanitize)
    .use(rehypeHighlight)
    .process(content)
  return String(file)
}

export function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m)
  if (match) return match[1].trim()
  const firstLine = content.split("\n")[0]?.trim()
  if (firstLine) return firstLine.slice(0, 60)
  return "Untitled"
}

export function extractWikilinks(content: string): string[] {
  const regex = /\[\[([^\]]+)\]\]/g
  const links: string[] = []
  let match: RegExpExecArray | null
  while ((match = regex.exec(content)) !== null) {
    links.push(match[1].trim())
  }
  return links
}

export function extractTags(content: string): string[] {
  const regex = /#([a-zA-Z0-9_-]+)/g
  const tags: string[] = []
  let match: RegExpExecArray | null
  while ((match = regex.exec(content)) !== null) {
    tags.push(match[1].toLowerCase())
  }
  return [...new Set(tags)]
}
