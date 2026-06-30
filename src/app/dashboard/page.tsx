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
        <div className="mx-auto max-w-4xl p-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{greeting}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {notes.length} notes · {notes.reduce((a, n) => a + n.links.length, 0)} links · {mostRecentTime ? `updated ${mostRecentTime} ago` : "never"}
              </p>
            </div>
            <Button onClick={handleNewNote} className="gap-2">
              <Plus className="size-4" />
              New Note
              <kbd className="ml-1 rounded border border-primary-foreground/20 px-1.5 py-0.5 text-[10px] font-mono opacity-60">
                ⌘N
              </kbd>
            </Button>
          </div>

          {loading ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Loading notes...
            </div>
          ) : !settings.vaultPath ? (
            <div className="flex flex-col items-center justify-center gap-5 py-20 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl border border-border bg-card">
                <FileText className="size-7 text-muted-foreground" />
              </div>
              <div>
                <p className="text-base font-medium">No vault open</p>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  Open a folder containing .md files to start building your knowledge graph.
                </p>
              </div>
              <Button onClick={() => router.push("/settings")}>
                Open Settings
              </Button>
            </div>
          ) : recentNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-5 py-20 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl border border-border bg-card">
                <FileText className="size-7 text-muted-foreground" />
              </div>
              <div>
                <p className="text-base font-medium">Your vault is quiet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create your first note to start connecting ideas.
                </p>
              </div>
              <Button onClick={handleNewNote}>
                <Plus className="size-4" />
                New Note
              </Button>
            </div>
          ) : (
            <>
              {/* Stats summary */}
              <div className="mb-6 grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-border bg-card px-5 py-4">
                  <p className="text-3xl font-bold tabular-nums">{notes.length}</p>
                  <p className="mt-0.5 text-xs font-medium text-muted-foreground">Notes</p>
                </div>
                <div className="rounded-xl border border-border bg-card px-5 py-4">
                  <p className="text-3xl font-bold tabular-nums">
                    {notes.reduce((acc, n) => acc + n.links.length, 0)}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-muted-foreground">Links</p>
                </div>
                <div className="rounded-xl border border-border bg-card px-5 py-4">
                  <p className="text-3xl font-bold tabular-nums">
                    {new Set(notes.flatMap((n) => n.tags)).size}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-muted-foreground">Tags</p>
                </div>
              </div>

              {/* Section header */}
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Recent Notes
              </h2>

              <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                {recentNotes.map((note) => {
                  const preview = getPreview(note.content)
                  return (
                    <button
                      key={note.path}
                      onClick={() =>
                        router.push(`/note/${encodeURIComponent(note.path)}`)
                      }
                      className="group flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 text-left transition-all duration-150 hover:border-primary/20 hover:bg-accent/40 hover:shadow-elevated"
                    >
                      <div className="flex w-full items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold">
                          {note.title || "Untitled"}
                        </p>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {new Date(note.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      {preview && (
                        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {preview}
                        </p>
                      )}
                      {note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {note.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-medium text-primary"
                            >
                              #{tag}
                            </span>
                          ))}
                          {note.tags.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{note.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
