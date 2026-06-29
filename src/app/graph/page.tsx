"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { KnowledgeGraph } from "@/components/graph/knowledge-graph"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Loader2, RotateCcw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useStore } from "@/store/useStore"
import type { GraphData } from "@/types"

export default function GraphPage() {
  const [data, setData] = useState<GraphData | null>(null)
  const [loading, setLoading] = useState(true)
  const [highlightTerm, setHighlightTerm] = useState("")
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [allTags, setAllTags] = useState<string[]>([])
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
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border px-4 py-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={highlightTerm}
              onChange={(e) => setHighlightTerm(e.target.value)}
              placeholder="Highlight nodes..."
              className="h-8 pl-8 text-xs"
            />
          </div>
          <Select
            value={tagFilter ?? "all"}
            onValueChange={(v) => setTagFilter(v === "all" ? null : v)}
          >
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue placeholder="Filter by tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                All tags
              </SelectItem>
              {allTags.map((tag) => (
                <SelectItem key={tag} value={tag} className="text-xs">
                  #{tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={loadGraph}
          >
            <RotateCcw className="mr-1 size-3" />
            Refresh
          </Button>
        </div>

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
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
            <Search className="size-12" />
            <p className="text-lg font-medium">No graph data</p>
            <p className="text-sm">
              Create notes with [[wikilinks]] and #tags to see your knowledge
              graph.
            </p>
          </div>
        ) : (
          <div className="flex-1">
            <KnowledgeGraph
              nodes={data.nodes}
              edges={data.edges}
              onNodeClick={handleNodeClick}
              highlightTerm={highlightTerm || undefined}
              tagFilter={tagFilter}
            />
          </div>
        )}
      </main>
    </div>
  )
}
