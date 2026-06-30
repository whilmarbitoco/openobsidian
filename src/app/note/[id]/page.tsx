"use client"

import { useEffect, useState, useCallback, useRef, Fragment } from "react"
import { useParams, useRouter } from "next/navigation"
import { useStore } from "@/store/useStore"
import { Sidebar } from "@/components/sidebar"
import { MarkdownEditor } from "@/components/editor/markdown-editor"
import { MarkdownPreview } from "@/components/editor/markdown-preview"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  ArrowLeft,
  Save,
  Hash,
  Trash2,
  Plus,
  GripVertical,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import type { Note } from "@/types"
import { cn } from "@/lib/utils"

export default function NotePage() {
  const params = useParams()
  const router = useRouter()
  const { settings } = useStore()
  const [note, setNote] = useState<Note | null>(null)
  const [content, setContent] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [autoSaving, setAutoSaving] = useState(false)
  const [previewCollapsed, setPreviewCollapsed] = useState(false)
  const [splitRatio, setSplitRatio] = useState(0.5)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const notePath = params.id ? decodeURIComponent(params.id as string) : ""

  useEffect(() => {
    if (notePath) {
      loadNote()
    }
  }, [notePath])

  const loadNote = async () => {
    try {
      const res = await fetch(
        `/api/notes?path=${encodeURIComponent(notePath)}`
      )
      if (res.ok) {
        const data = await res.json()
        setNote(data)
        setContent(data.content)
        setHasChanges(false)
      } else {
        toast.error("Failed to load note")
        router.push("/dashboard")
      }
    } catch (err) {
      console.error("Failed to load note:", err)
      toast.error("Failed to load note")
    }
  }

  const doSave = useCallback(async (saveContent: string) => {
    if (!notePath || !note) return
    setIsSaving(true)
    try {
      const res = await fetch("/api/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: notePath, content: saveContent }),
      })
      if (res.ok) {
        const updated = await res.json()
        setNote(updated)
        setHasChanges(false)
        toast.success("Note saved")
      } else {
        toast.error("Failed to save note")
      }
    } catch (err) {
      console.error("Failed to save note:", err)
      toast.error("Failed to save note")
    } finally {
      setIsSaving(false)
      setAutoSaving(false)
    }
  }, [notePath, note])

  const doAutoSave = useCallback(async () => {
    if (!notePath || !hasChanges || isSaving) return
    setAutoSaving(true)
    await doSave(content)
  }, [notePath, hasChanges, isSaving, doSave, content])

  useEffect(() => {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
    if (hasChanges && note) {
      autoSaveRef.current = setTimeout(() => doAutoSave(), 500)
    }
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current) }
  }, [content, hasChanges, note, doAutoSave])

  const handleSave = useCallback(async () => {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
    await doSave(content)
  }, [doSave, content])

  const handleDelete = useCallback(async () => {
    if (!notePath) return
    if (!window.confirm("Are you sure you want to delete this note?")) return
    try {
      const res = await fetch(`/api/notes?path=${encodeURIComponent(notePath)}`, {
        method: "DELETE",
      })
      if (res.ok) {
        toast.success("Note deleted")
        router.push("/dashboard")
      } else {
        toast.error("Failed to delete note")
      }
    } catch {
      toast.error("Failed to delete note")
    }
  }, [notePath, router])

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    setHasChanges(true)
  }

  const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  useEffect(() => {
    if (!isDragging) return
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      setSplitRatio(
        Math.max(0.2, Math.min(0.8, (e.clientX - rect.left) / rect.width))
      )
    }
    const handleMouseUp = () => setIsDragging(false)
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging])

  const wordCount = content.split(/\s+/).filter(Boolean).length
  const breadcrumbParts = notePath.replace(/\.md$/, "").split("/")

  if (!note) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Loading note...</p>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center gap-3 border-b border-border px-4 py-2">
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 text-muted-foreground"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="size-3.5" />
          </Button>

          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium">{note.title}</span>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground/50">
              <span>vault</span>
              {breadcrumbParts.map((part, i) => (
                <Fragment key={i}>
                  <span className="text-muted-foreground/30">/</span>
                  <span
                    className={cn(
                      i === breadcrumbParts.length - 1 && "text-muted-foreground/70"
                    )}
                  >
                    {part}
                  </span>
                </Fragment>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-muted-foreground/60">
            <span className="tabular-nums">{wordCount}w</span>
          </div>

          <div className="flex items-center gap-1.5">
            {isSaving || autoSaving ? (
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
                <span className="inline-block size-1.5 animate-pulse rounded-full bg-yellow-500" />
                Saving...
              </span>
            ) : hasChanges ? (
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
                <span className="inline-block size-1.5 rounded-full bg-yellow-500" />
                Unsaved
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[11px] text-green-500/80">
                <span className="inline-block size-1.5 rounded-full bg-green-500" />
                Saved
              </span>
            )}
          </div>

          <Separator orientation="vertical" className="mx-0.5 h-5" />

          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 text-destructive/70 hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="size-3.5" />
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="h-7 text-xs"
          >
            <Save className="size-3.5" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </header>

        {note.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 border-b border-border/50 px-4 py-1.5">
            {note.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-accent-soft/60 px-2.5 py-0.5 text-[11px] font-mono text-primary/80"
              >
                <Hash className="size-2.5" />
                {tag}
              </span>
            ))}
            <button className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] text-muted-foreground/40 transition-colors hover:text-muted-foreground/70">
              <Plus className="size-2.5" />
              Add tag
            </button>
          </div>
        )}

        <div ref={containerRef} className="flex flex-1 overflow-hidden">
          <div
            className="overflow-hidden"
            style={{
              flex: previewCollapsed ? "1 1 100%" : `0 0 ${splitRatio * 100}%`,
              minWidth: 0,
            }}
          >
            <MarkdownEditor
              value={content}
              onChange={handleContentChange}
              onSave={handleSave}
            />
          </div>

          {!previewCollapsed && (
            <div
              className={cn(
                "relative flex w-2 shrink-0 cursor-col-resize items-center justify-center bg-transparent transition-colors hover:bg-accent/20",
                isDragging && "bg-accent/30"
              )}
              onMouseDown={handleDividerMouseDown}
            >
              <div className="flex h-8 items-center rounded-full bg-border px-0.5">
                <GripVertical className="size-3 text-muted-foreground" />
              </div>
              <button
                className="absolute -right-3 top-2 z-10 flex size-5 items-center justify-center rounded-full border border-border bg-surface-elevated text-muted-foreground transition-colors hover:text-primary"
                onClick={() => setPreviewCollapsed(true)}
                title="Hide preview"
              >
                <ChevronRight className="size-3" />
              </button>
            </div>
          )}

          {previewCollapsed && (
            <button
              className="flex w-6 shrink-0 items-center justify-center border-l border-border bg-transparent text-muted-foreground transition-colors hover:bg-accent/20"
              onClick={() => setPreviewCollapsed(false)}
              title="Show preview"
            >
              <ChevronLeft className="size-3" />
            </button>
          )}

          {!previewCollapsed && (
            <div className="flex flex-1 overflow-hidden">
              <MarkdownPreview content={content} />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
