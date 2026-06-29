"use client"

import { useEffect, useState, useMemo } from "react"
import { useStore } from "@/store/useStore"
import { createNote } from "@/lib/vault"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { FileText, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Note } from "@/types"

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d`
  return `${Math.floor(days / 30)}mo`
}

function getPreview(content: string): string {
  return content
    .split("\n")
    .filter((line) => line.trim())
    .slice(0, 2)
    .join("\n")
}

export default function DashboardPage() {
  const { settings } = useStore()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (settings.vaultPath) {
      loadNotes()
    }
  }, [settings.vaultPath])

  const loadNotes = async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/notes?vaultPath=${encodeURIComponent(settings.vaultPath)}`
      )
      if (res.ok) {
        const data = await res.json()
        setNotes(data)
      }
    } catch (err) {
      console.error("Failed to load notes:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleNewNote = async () => {
    if (!settings.vaultPath) return
    try {
      const note = await createNote(settings.vaultPath, "Untitled")
      router.push(`/note/${encodeURIComponent(note.path)}`)
    } catch (err) {
      console.error("Failed to create note:", err)
    }
  }

  const sortedNotes = useMemo(
    () =>
      [...notes].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [notes]
  )

  const recentNotes = sortedNotes.slice(0, 10)
  const untaggedNotes = notes.filter((n) => n.tags.length === 0)
  const orphanNotes = notes.filter((n) => n.links.length === 0)
  const greeting = getGreeting()
  const mostRecentTime =
    notes.length > 0 ? timeAgo(sortedNotes[0].updatedAt) : null

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-4xl p-6">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{greeting}</h1>
              <p className="mt-1 font-mono text-xs text-muted-foreground tabular-nums">
                ↓ {notes.length} notes
                {untaggedNotes.length > 0 &&
                  ` · ${untaggedNotes.length} untagged`}
                {orphanNotes.length > 0 && ` · ${orphanNotes.length} orphan`}
                {mostRecentTime && ` · updated ${mostRecentTime} ago`}
              </p>
            </div>
            <Button onClick={handleNewNote} className="gap-2">
              <Plus className="size-4" />
              New Note
              <span className="ml-1 rounded border border-primary-foreground/20 px-1.5 py-0.5 text-[10px] font-mono opacity-60">
                ⌘N
              </span>
            </Button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Loading notes...
            </div>
          ) : !settings.vaultPath ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <FileText className="size-12 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No vault open. Configure your vault path in Settings to get
                started.
              </p>
            </div>
          ) : recentNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <FileText className="size-12 text-muted-foreground/40" />
              <p className="text-base font-medium">Your vault is quiet</p>
              <p className="text-sm text-muted-foreground">
                Let&apos;s change that →
              </p>
              <Button onClick={handleNewNote}>
                <Plus className="size-4" />
                New Note
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {recentNotes.map((note) => {
                const preview = getPreview(note.content)
                return (
                  <button
                    key={note.path}
                    onClick={() =>
                      router.push(`/note/${encodeURIComponent(note.path)}`)
                    }
                    className="group flex flex-col items-start gap-2 rounded-[var(--radius-card)] border border-border bg-card p-4 text-left shadow-elevated transition-all duration-150 hover:translate-y-[-2px] hover:shadow-lg hover:bg-accent/50"
                  >
                    <div className="flex w-full items-start justify-between gap-2">
                      <p className="truncate text-sm font-medium">
                        {note.title || "Untitled"}
                      </p>
                      <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(note.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {preview && (
                      <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {preview}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {note.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="font-mono text-[10px] text-muted-foreground/70"
                        >
                          #{tag}
                        </span>
                      ))}
                      {note.tags.length > 3 && (
                        <span className="text-[10px] text-muted-foreground/50">
                          +{note.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
