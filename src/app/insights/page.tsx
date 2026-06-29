"use client"

import { useEffect, useState, useCallback } from "react"
import { Sidebar } from "@/components/sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { useStore } from "@/store/useStore"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { EmptyState } from "@/components/empty-state"
import {
  Clock,
  Hash,
  ExternalLink,
  Link2,
  AlertTriangle,
  Lightbulb,
  FileText,
  Wifi,
  WifiOff,
  RefreshCw,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Note } from "@/types"
import type { InsightConflict, LinkSuggestion } from "@/lib/ai"

type AiState = "loading" | "connected" | "disconnected"

export default function InsightsPage() {
  const { settings, vaultStructure, setVaultStructure } = useStore()
  const [notes, setNotes] = useState<Note[]>([])
  const [loadingNotes, setLoadingNotes] = useState(true)
  const [aiState, setAiState] = useState<AiState>("loading")
  const [insightConflicts, setInsightConflicts] = useState<InsightConflict[]>([])
  const [linkSuggestions, setLinkSuggestions] = useState<LinkSuggestion[]>([])
  const [loadingAi, setLoadingAi] = useState(false)
  const router = useRouter()

  const loadNotes = useCallback(async () => {
    if (!settings.vaultPath) {
      setLoadingNotes(false)
      return
    }
    setLoadingNotes(true)
    try {
      const res = await fetch(
        `/api/notes?vaultPath=${encodeURIComponent(settings.vaultPath)}`
      )
      if (res.ok) {
        const data = await res.json()
        setNotes(data)
      }
    } catch {
      toast.error("Failed to load notes")
    } finally {
      setLoadingNotes(false)
    }
  }, [settings.vaultPath])

  const checkAi = useCallback(async () => {
    try {
      const res = await fetch("/api/insights", { signal: AbortSignal.timeout(3000) })
      if (res.ok) {
        setAiState("connected")
        return true
      }
      setAiState("disconnected")
      return false
    } catch {
      setAiState("disconnected")
      return false
    }
  }, [])

  const loadAiData = useCallback(async () => {
    setLoadingAi(true)
    try {
      const isConnected = await checkAi()
      if (isConnected) {
        const [conflictRes, suggRes] = await Promise.allSettled([
          fetch("/api/insight-conflicts"),
          fetch("/api/link-suggestions"),
        ])

        if (conflictRes.status === "fulfilled" && conflictRes.value.ok) {
          setInsightConflicts(await conflictRes.value.json())
        }
        if (suggRes.status === "fulfilled" && suggRes.value.ok) {
          setLinkSuggestions(await suggRes.value.json())
        }
      }
    } catch {
      setAiState("disconnected")
    } finally {
      setLoadingAi(false)
    }
  }, [checkAi])

  useEffect(() => {
    loadNotes()
    loadAiData()
  }, [loadNotes, loadAiData])

  const sortedNotes = [...notes].sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )

  const recentNotes = sortedNotes.slice(0, 10)
  const untaggedNotes = notes.filter((n) => n.tags.length === 0)
  const orphanNotes = notes.filter(
    (n) => n.links.length === 0
  )

  const handleRefresh = () => {
    loadNotes()
    loadAiData()
    toast.success("Refreshed")
  }

  const AiBadge = () => {
    if (aiState === "loading") {
      return (
        <Badge variant="outline" className="gap-1 text-xs">
          <Skeleton className="size-2 rounded-full" />
          Checking...
        </Badge>
      )
    }
    if (aiState === "connected") {
      return (
        <Badge variant="outline" className="gap-1 border-green-500/30 text-xs text-green-500">
          <span className="size-2 rounded-full bg-green-500" />
          AI Connected
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="gap-1 border-red-500/30 text-xs text-red-400">
        <span className="size-2 rounded-full bg-red-500" />
        AI Offline
      </Badge>
    )
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-border px-6 py-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">Insights</h1>
            <AiBadge />
          </div>
          <Button variant="ghost" size="icon" className="size-8" onClick={handleRefresh}>
            <RefreshCw className="size-4" />
          </Button>
        </header>

        <ScrollArea className="flex-1">
          <div className="mx-auto max-w-4xl space-y-6 p-6">
            <Section
              icon={<Clock className="size-4" />}
              title="Recently Modified"
            >
              {loadingNotes ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : recentNotes.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No notes yet"
                  description="Open a vault in Settings to get started."
                  actionLabel="Open Settings"
                  actionHref="/settings"
                />
              ) : (
                <div className="space-y-1">
                  {recentNotes.map((note) => (
                    <button
                      key={note.path}
                      onClick={() =>
                        router.push(`/note/${encodeURIComponent(note.path)}`)
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
            </Section>

            <Section
              icon={<Hash className="size-4" />}
              title="Untagged Notes"
              count={untaggedNotes.length}
            >
              {loadingNotes ? (
                <Skeleton className="h-24 w-full" />
              ) : untaggedNotes.length === 0 ? (
                <EmptyState
                  icon={Hash}
                  title="All notes tagged"
                  description="Every note has at least one tag. Great organization!"
                />
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {untaggedNotes.map((note) => (
                    <button
                      key={note.path}
                      onClick={() =>
                        router.push(`/note/${encodeURIComponent(note.path)}`)
                      }
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs hover:bg-accent transition-colors"
                    >
                      <FileText className="size-3 shrink-0" />
                      {note.title}
                    </button>
                  ))}
                </div>
              )}
            </Section>

            <Section
              icon={<ExternalLink className="size-4" />}
              title="Orphan Notes"
              count={orphanNotes.length}
            >
              {loadingNotes ? (
                <Skeleton className="h-24 w-full" />
              ) : orphanNotes.length === 0 ? (
                <EmptyState
                  icon={Link2}
                  title="No orphans"
                  description="All your notes are connected via wikilinks."
                />
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {orphanNotes.map((note) => (
                    <button
                      key={note.path}
                      onClick={() =>
                        router.push(`/note/${encodeURIComponent(note.path)}`)
                      }
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs hover:bg-accent transition-colors"
                    >
                      <FileText className="size-3 shrink-0" />
                      {note.title}
                    </button>
                  ))}
                </div>
              )}
            </Section>

            {aiState === "connected" ? (
              <>
                <Section
                  icon={<Lightbulb className="size-4" />}
                  title="Suggested Links"
                >
                  {loadingAi ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : linkSuggestions.length === 0 ? (
                    <EmptyState
                      icon={Lightbulb}
                      title="No suggestions"
                      description="The AI will suggest links as you add more notes."
                    />
                  ) : (
                    <div className="space-y-2">
                      {linkSuggestions.map((s) => (
                        <Card key={s.id}>
                          <CardContent className="p-3">
                            <div className="mb-1.5 flex items-center gap-2 text-sm">
                              <span className="font-mono text-xs font-medium">
                                {s.noteA}
                              </span>
                              <ArrowRight className="size-3 text-muted-foreground shrink-0" />
                              <span className="font-mono text-xs font-medium">
                                {s.noteB}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {s.reason}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </Section>

                <Section
                  icon={<AlertTriangle className="size-4" />}
                  title="Conflicts"
                >
                  {loadingAi ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                      ))}
                    </div>
                  ) : insightConflicts.length === 0 ? (
                    <EmptyState
                      icon={AlertTriangle}
                      title="No conflicts found"
                      description="Your knowledge base is consistent."
                    />
                  ) : (
                    <div className="space-y-3">
                      {insightConflicts.map((c) => (
                        <Card key={c.id} className="border-amber-500/20">
                          <CardContent className="p-3">
                            <div className="relative mb-2 flex items-center gap-3">
                              <div className="flex-1 rounded-md bg-card p-2 text-xs">
                                <p className="mb-1 font-medium text-amber-400">
                                  Note A
                                </p>
                                <p className="font-mono text-muted-foreground">
                                  {c.noteA}
                                </p>
                              </div>
                              <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/10 text-xs font-medium text-amber-400">
                                vs
                              </div>
                              <div className="flex-1 rounded-md bg-card p-2 text-xs">
                                <p className="mb-1 font-medium text-amber-400">
                                  Note B
                                </p>
                                <p className="font-mono text-muted-foreground">
                                  {c.noteB}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>
                                {c.description}
                              </span>
                              <span>
                                Detected{" "}
                                {new Date(c.detectedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </Section>
              </>
            ) : aiState === "disconnected" ? (
              <Section
                icon={<WifiOff className="size-4" />}
                title="AI-Powered Insights"
              >
                <Card>
                  <CardContent className="p-6 text-center">
                    <WifiOff className="mx-auto mb-3 size-8 text-muted-foreground/50" />
                    <p className="mb-1 text-sm font-medium">
                      AI backend is not connected
                    </p>
                    <p className="mb-4 text-xs text-muted-foreground">
                      Start the AI backend to enable insights
                      including suggested links and conflict detection.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/settings")}
                    >
                      <Wifi className="size-4" />
                      Configure
                    </Button>
                  </CardContent>
                </Card>
              </Section>
            ) : null}
          </div>
        </ScrollArea>
      </main>
    </div>
  )
}

function Section({
  icon,
  title,
  count,
  children,
}: {
  icon: React.ReactNode
  title: string
  count?: number
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <h2 className="text-sm font-semibold">{title}</h2>
        {count !== undefined && (
          <Badge variant="secondary" className="text-[10px]">
            {count}
          </Badge>
        )}
      </div>
      {children}
    </section>
  )
}
