"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, FileText, Hash, Sparkles, CornerDownLeft } from "lucide-react"
import { createPortal } from "react-dom"
import type { Note } from "@/types"
import { cn } from "@/lib/utils"

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ResultItem {
  id: string
  label: string
  description?: string
  icon?: React.ReactNode
  onSelect: () => void
}

type Row =
  | { kind: "header"; label: string }
  | { kind: "item"; item: ResultItem }

const RECENT_KEY = "oo-recent"

function getRecentPaths(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]")
  } catch {
    return []
  }
}

function pushRecent(path: string) {
  const arr = getRecentPaths().filter((p) => p !== path)
  arr.unshift(path)
  localStorage.setItem(RECENT_KEY, JSON.stringify(arr.slice(0, 10)))
}

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const regex = new RegExp(`(${escaped})`, "gi")
  return text.split(regex).map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-accent-glow text-primary rounded-none">
        {part}
      </mark>
    ) : (
      part
    )
  )
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [query, setQuery] = useState("")
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [mounted, setMounted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    setQuery("")
    setSelectedIdx(0)
    const load = async () => {
      try {
        const res = await fetch("/api/notes")
        if (res.ok) setNotes(await res.json())
      } catch {}
    }
    load()
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  const q = query.toLowerCase().trim()

  const rows: Row[] = []
  const selectable: ResultItem[] = []

  const addItem = (item: ResultItem) => {
    rows.push({ kind: "item", item })
    selectable.push(item)
  }

  if (!q) {
    const recentPaths = getRecentPaths()
    const recentNotes = notes.filter((n) => recentPaths.includes(n.path))
    if (recentNotes.length > 0) {
      rows.push({ kind: "header", label: "Recent" })
      for (const note of recentNotes) {
        addItem({
          id: note.path,
          label: note.title,
          description: note.tags.map((t) => `#${t}`).join(" "),
          icon: <FileText className="size-4 shrink-0 text-muted-foreground" />,
          onSelect: () => {
            pushRecent(note.path)
            onOpenChange(false)
            router.push(`/note/${encodeURIComponent(note.path)}`)
          },
        })
      }
    }
  }

  const matchingNotes = q
    ? notes.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q)) ||
          n.path.toLowerCase().includes(q)
      )
    : notes

  if (matchingNotes.length > 0) {
    rows.push({ kind: "header", label: "Notes" })
    for (const note of matchingNotes.slice(0, 8)) {
      addItem({
        id: note.path,
        label: note.title,
        description: note.tags.map((t) => `#${t}`).join(" "),
        icon: <FileText className="size-4 shrink-0 text-muted-foreground" />,
        onSelect: () => {
          pushRecent(note.path)
          onOpenChange(false)
          router.push(`/note/${encodeURIComponent(note.path)}`)
        },
      })
    }
  }

  if (q) {
    const allTags = [...new Set(notes.flatMap((n) => n.tags))]
    const matchingTags = allTags.filter((t) => t.toLowerCase().includes(q))
    if (matchingTags.length > 0) {
      rows.push({ kind: "header", label: "Tags" })
      for (const tag of matchingTags.slice(0, 5)) {
        addItem({
          id: `tag:${tag}`,
          label: `#${tag}`,
          description: `${notes.filter((n) => n.tags.includes(tag)).length} notes`,
          icon: <Hash className="size-4 shrink-0 text-muted-foreground" />,
          onSelect: () => {
            onOpenChange(false)
            router.push(`/search?tag=${encodeURIComponent(tag)}`)
          },
        })
      }
    }
  }

  const actions = [
    {
      label: "New Note",
      description: "Create a new note",
      icon: <FileText className="size-4 shrink-0 text-muted-foreground" />,
      action: () => {
        onOpenChange(false)
        router.push("/dashboard?new=true")
      },
    },
    {
      label: "Open Graph",
      description: "View knowledge graph",
      icon: <Sparkles className="size-4 shrink-0 text-muted-foreground" />,
      action: () => {
        onOpenChange(false)
        router.push("/graph")
      },
    },
    {
      label: "Search Notes",
      description: "Full-text search",
      icon: <Search className="size-4 shrink-0 text-muted-foreground" />,
      action: () => {
        onOpenChange(false)
        router.push("/search")
      },
    },
  ]

  const filteredActions = q
    ? actions.filter((a) => a.label.toLowerCase().includes(q))
    : actions

  if (filteredActions.length > 0) {
    rows.push({ kind: "header", label: "Actions" })
    for (const action of filteredActions) {
      addItem({
        id: `action:${action.label}`,
        label: action.label,
        description: action.description,
        icon: action.icon,
        onSelect: action.action,
      })
    }
  }

  const pages = [
    {
      label: "Dashboard",
      icon: <Sparkles className="size-4 shrink-0 text-muted-foreground" />,
      action: () => {
        onOpenChange(false)
        router.push("/dashboard")
      },
    },
    {
      label: "Settings",
      icon: <Hash className="size-4 shrink-0 text-muted-foreground" />,
      action: () => {
        onOpenChange(false)
        router.push("/settings")
      },
    },
    {
      label: "Insights",
      icon: <FileText className="size-4 shrink-0 text-muted-foreground" />,
      action: () => {
        onOpenChange(false)
        router.push("/insights")
      },
    },
  ]

  const filteredPages = q
    ? pages.filter((p) => p.label.toLowerCase().includes(q))
    : pages

  if (filteredPages.length > 0) {
    rows.push({ kind: "header", label: "Pages" })
    for (const page of filteredPages) {
      addItem({
        id: `page:${page.label}`,
        label: page.label,
        icon: page.icon,
        onSelect: page.action,
      })
    }
  }

  const safeIdx = Math.min(selectedIdx, Math.max(0, selectable.length - 1))

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (selectable.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIdx((prev) => (prev + 1) % selectable.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIdx((prev) => (prev - 1 + selectable.length) % selectable.length)
    } else if (e.key === "Enter") {
      e.preventDefault()
      selectable[safeIdx]?.onSelect()
    } else if (e.key === "Escape") {
      e.preventDefault()
      onOpenChange(false)
    }
  }

  if (!open || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className="fixed left-1/2 top-[12%] w-full max-w-xl -translate-x-1/2 animate-scale-in">
        <div className="overflow-hidden rounded-card border border-accent/20 bg-surface-elevated shadow-elevated">
          <div className="relative flex items-center border-b border-border">
            <Search className="absolute left-4 size-5 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setSelectedIdx(0)
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search notes, tags, or actions..."
              className="w-full border-0 bg-transparent py-4 pl-12 pr-4 text-lg outline-none placeholder:text-muted-foreground"
            />
          </div>

          {selectable.length > 0 ? (
            <div className="max-h-80 overflow-y-auto p-2" role="listbox">
              {rows.map((row, i) => {
                if (row.kind === "header") {
                  return (
                    <div
                      key={`hdr-${i}`}
                      className="px-3 pb-1 pt-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
                    >
                      {row.label}
                    </div>
                  )
                }
                const itemIdx = selectable.indexOf(row.item)
                const isSelected = itemIdx === safeIdx

                return (
                  <button
                    key={row.item.id}
                    onClick={row.item.onSelect}
                    onMouseEnter={() => setSelectedIdx(itemIdx)}
                    role="option"
                    aria-selected={isSelected}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors",
                      isSelected
                        ? "border-l-2 border-primary bg-accent-soft"
                        : "border-l-2 border-transparent hover:bg-accent/50"
                    )}
                  >
                    {row.item.icon}
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">
                        {q
                          ? highlightMatch(row.item.label, q)
                          : row.item.label}
                      </div>
                      {row.item.description && (
                        <div className="truncate text-xs text-muted-foreground">
                          {q
                            ? highlightMatch(row.item.description, q)
                            : row.item.description}
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Search className="size-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                {query.trim() ? (
                  <>No results for &ldquo;{query}&rdquo;</>
                ) : (
                  <>No notes in vault</>
                )}
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-border px-4 py-2">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <CornerDownLeft className="size-3" /> select
            </span>
            <span className="text-xs text-muted-foreground">&uarr;&darr; navigate</span>
            <span className="text-xs text-muted-foreground">esc close</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
