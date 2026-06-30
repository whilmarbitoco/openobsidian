"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { KnowledgeGraph } from "@/components/graph/knowledge-graph"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import { Search, RotateCcw, Maximize2, Minimize2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useStore } from "@/store/useStore"
import type { GraphData } from "@/types"
import { cn } from "@/lib/utils"

export default function GraphPage() {
  const [data, setData] = useState<GraphData | null>(null)
  const [loading, setLoading] = useState(true)
  const [highlightTerm, setHighlightTerm] = useState("")
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [allTags, setAllTags] = useState<string[]>([])
  const [focusMode, setFocusMode] = useState(false)
  const router = useRouter()
  const { settings } = useStore()

  useEffect(() => {
    loadGraph()
  }, [])

  const loadGraph = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/graph")
      if (res.ok) {
        const graphData: GraphData = await res.json()
        setData(graphData)
        const tags = new Set<string>()
        for (const node of graphData.nodes) {
          for (const tag of node.tags) {
            tags.add(tag)
          }
        }
        setAllTags(Array.from(tags).sort())
      }
    } catch (err) {
      console.error("Failed to load graph:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleNodeClick = (nodeId: string) => {
    router.push(`/note/${encodeURIComponent(nodeId)}`)
  }

  return (
    <div className="flex h-screen">
      {!focusMode && <Sidebar />}
      <main className="flex flex-1 flex-col overflow-hidden">
        {loading ? (
          <div className="flex flex-1 items-center justify-center p-8">
            <div className="w-full max-w-3xl space-y-4">
              <Skeleton className="h-64 w-full rounded-lg" />
              <div className="flex gap-4">
                <Skeleton className="size-16 rounded-full" />
                <Skeleton className="size-12 rounded-full" />
                <Skeleton className="size-20 rounded-full" />
                <Skeleton className="size-14 rounded-full" />
              </div>
              <Skeleton className="h-8 w-1/2" />
            </div>
          </div>
        ) : !data || data.nodes.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState
              icon={Search}
              title="No graph data"
              description="Create notes with [[wikilinks]] and #tags to see your knowledge graph."
              actionLabel="Create a note"
              actionHref="/dashboard"
            />
          </div>
        ) : (
          <div className={cn(
            "relative flex-1 overflow-hidden",
            focusMode && "after:pointer-events-none after:absolute after:inset-0 after:shadow-[inset_0_0_120px_rgba(0,0,0,0.6)] after:z-20"
          )}>
            <KnowledgeGraph
              nodes={data.nodes}
              edges={data.edges}
              onNodeClick={handleNodeClick}
              highlightTerm={highlightTerm || undefined}
              tagFilter={tagFilter}
            />

            <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-lg border border-border/50 bg-surface-elevated/95 px-3 py-2 shadow-elevated backdrop-blur-md">
              <Search className="size-3.5 shrink-0 text-muted-foreground/60" />
              <input
                value={highlightTerm}
                onChange={(e) => setHighlightTerm(e.target.value)}
                placeholder="Search nodes..."
                className="h-5 w-28 bg-transparent text-xs outline-none placeholder:text-muted-foreground/40 md:w-36"
              />
              <span className="h-3 w-px bg-border/50" />
              <select
                value={tagFilter ?? "all"}
                onChange={(e) => setTagFilter(e.target.value === "all" ? null : e.target.value)}
                className="h-5 max-w-[100px] bg-transparent text-xs outline-none"
              >
                <option value="all">All tags</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>
                    #{tag}
                  </option>
                ))}
              </select>
              <button
                onClick={loadGraph}
                className="ml-0.5 rounded-full p-1 text-muted-foreground/60 transition-colors hover:text-foreground"
                title="Reset view"
              >
                <RotateCcw className="size-3" />
              </button>
            </div>

            <div className="absolute bottom-4 left-4 z-10 rounded-lg border border-border/50 bg-surface-elevated/95 px-3 py-2 shadow-elevated backdrop-blur-md">
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground/70">
                <span className="tabular-nums">{data.nodes.length} nodes</span>
                <span className="tabular-nums">{data.edges.length} edges</span>
                {allTags.slice(0, 4).map((tag) => (
                  <span key={tag} className="flex items-center gap-1">
                    <span
                      className="inline-block size-1.5 rounded-full"
                      style={{ backgroundColor: getTagColor(tag) }}
                    />
                    <span>{tag}</span>
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => setFocusMode(!focusMode)}
              className="absolute right-4 top-4 z-10 rounded-full border border-border bg-surface-elevated/90 p-2 shadow-elevated backdrop-blur-sm text-muted-foreground transition-colors hover:text-foreground"
              title={focusMode ? "Exit focus mode" : "Focus mode"}
            >
              {focusMode ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

function getTagColor(tag: string): string {
  const COLORS: Record<string, string> = {
    project: "#8b5cf6",
    idea: "#10b981",
    person: "#ec4899",
    topic: "#3b82f6",
    reference: "#8b5cf6",
  }
  return COLORS[tag] || "#6366f1"
}
