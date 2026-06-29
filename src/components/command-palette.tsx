"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, FileText, Hash, ExternalLink } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import type { Note } from "@/types"

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [query, setQuery] = useState("")
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (open) {
      setQuery("")
      setSelectedIndex(0)
      loadNotes()
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const loadNotes = async () => {
    try {
      const res = await fetch("/api/notes")
      if (res.ok) {
        const data = await res.json()
        setNotes(data)
      }
    } catch {
      setNotes([])
    }
  }

  const filtered = query.trim()
    ? notes.filter((n) => {
        const q = query.toLowerCase()
        return (
          n.title.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q)) ||
          n.path.toLowerCase().includes(q)
        )
      })
    : notes

  const handleSelect = useCallback(
    (note: Note) => {
      onOpenChange(false)
      router.push(`/note/${encodeURIComponent(note.path)}`)
    },
    [onOpenChange, router]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % Math.max(filtered.length, 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(filtered.length, 1))
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault()
      handleSelect(filtered[selectedIndex])
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[15%] max-w-xl translate-y-0 p-0 gap-0">
        <div className="flex items-center border-b border-border px-4">
          <Search className="mr-3 size-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search notes..."
            className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        {filtered.length > 0 && (
          <div className="max-h-80 overflow-y-auto p-2">
            <p className="px-2 pb-1 text-[10px] font-medium uppercase text-muted-foreground">
              Notes
            </p>
            {filtered.map((note, index) => (
              <button
                key={note.path}
                onClick={() => handleSelect(note)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors ${
                  index === selectedIndex
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground hover:bg-accent/50"
                }`}
              >
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{note.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {note.tags.length > 0
                      ? note.tags.map((t) => `#${t}`).join(" ")
                      : "No tags"}
                  </p>
                </div>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </span>
              </button>
            ))}
          </div>
        )}
        {query.trim() && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
            <Search className="size-8" />
            <p>No notes match &ldquo;{query}&rdquo;</p>
          </div>
        )}
        {!query.trim() && notes.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
            <FileText className="size-8" />
            <p>No notes in vault</p>
          </div>
        )}
        <div className="flex items-center gap-4 border-t border-border px-4 py-2 text-[10px] text-muted-foreground">
          <span>↑↓ Navigate</span>
          <span>↵ Open</span>
          <span>Esc Close</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
