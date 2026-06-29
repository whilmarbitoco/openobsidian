"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Sidebar } from "@/components/sidebar"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import { Search, FileText, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useStore } from "@/store/useStore"
import type { SearchResult } from "@/types"

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const router = useRouter()
  const { settings } = useStore()

  const performSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      setSearched(false)
      return
    }
    setLoading(true)
    setSearched(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`)
      if (res.ok) {
        setResults(await res.json())
      }
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => performSearch(query), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, performSearch])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setQuery("")
      setResults([])
      setSearched(false)
    }
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="mx-auto w-full max-w-2xl px-4 py-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Start typing to search your vault..."
              className="h-12 pl-11 pr-10 text-lg ring-violet-500/30 focus-visible:ring-2"
              autoFocus
            />
            {query && (
              <button
                onClick={() => { setQuery(""); setResults([]); setSearched(false) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="mx-auto max-w-2xl px-4 pb-8">
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-lg" />
                ))}
              </div>
            ) : !searched ? (
              <EmptyState
                icon={Search}
                title="Search your vault"
                description="Start typing to search across all your notes."
              />
            ) : results.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No results found"
                description="Try different keywords or check your spelling."
              />
            ) : (
              <div className="space-y-2">
                <p className="mb-3 text-xs text-muted-foreground">
                  {results.length} result{results.length !== 1 ? "s" : ""}
                </p>
                {results.map((result) => (
                  <button
                    key={result.path}
                    onClick={() =>
                      router.push(`/note/${encodeURIComponent(result.path)}`)
                    }
                    className="w-full rounded-lg border border-border bg-card p-4 text-left transition-all duration-150 hover:border-primary/30 hover:bg-accent/50 hover:shadow-elevated"
                  >
                    <h3 className="mb-1 text-sm font-medium">{result.title}</h3>
                    <p
                      className="mb-2 text-xs text-muted-foreground leading-relaxed [&>mark]:rounded [&>mark]:bg-yellow-500/30 [&>mark]:px-0.5"
                      dangerouslySetInnerHTML={{ __html: result.snippet }}
                    />
                    <div className="flex items-center gap-2">
                      {result.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px]">
                          {tag}
                        </Badge>
                      ))}
                      <span className="ml-auto text-[10px] text-muted-foreground">
                        {new Date(result.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </main>
    </div>
  )
}
