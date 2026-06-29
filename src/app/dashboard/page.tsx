"use client"

import { useEffect, useState } from "react"
import { useStore } from "@/store/useStore"
import { listVault, createNote } from "@/lib/vault"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  FileText,
  Plus,
  Clock,
  Tags,
  Hash,
  ExternalLink,
} from "lucide-react"
import { useRouter } from "next/navigation"
import type { Note } from "@/types"

export default function DashboardPage() {
  const { settings, vaultStructure, setVaultStructure } = useStore()
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

  const sortedNotes = [...notes].sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )

  const recentNotes = sortedNotes.slice(0, 10)
  const untaggedNotes = notes.filter((n) => n.tags.length === 0)
  const orphanNotes = notes.filter((n) => n.links.length === 0)

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-4xl p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                {settings.vaultPath || "No vault open"}
              </p>
            </div>
            <Button onClick={handleNewNote}>
              <Plus className="size-4" />
              New Note
            </Button>
          </div>

          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <FileText className="size-4" />
                Total Notes
              </div>
              <p className="text-2xl font-bold">{notes.length}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Hash className="size-4" />
                Untagged
              </div>
              <p className="text-2xl font-bold">{untaggedNotes.length}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <ExternalLink className="size-4" />
                Orphans
              </div>
              <p className="text-2xl font-bold">{orphanNotes.length}</p>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Recent Notes</h2>
            </div>
            <Separator className="mb-4" />
            {loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Loading notes...
              </div>
            ) : recentNotes.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {settings.vaultPath
                  ? "No notes yet. Create your first note!"
                  : "Open a vault in Settings to get started."}
              </div>
            ) : (
              <div className="space-y-1">
                {recentNotes.map((note) => (
                  <button
                    key={note.path}
                    onClick={() =>
                      router.push(
                        `/note/${encodeURIComponent(note.path)}`
                      )
                    }
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {note.title}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {note.tags.length > 0
                          ? note.tags.map((t) => `#${t}`).join(" ")
                          : "No tags"}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
