"use client"

import { useEffect, useState, useCallback, useRef } from "react"
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
  Eye,
  Edit3,
  Hash,
  Trash2,
} from "lucide-react"
import type { Note } from "@/types"

export default function NotePage() {
  const params = useParams()
  const router = useRouter()
  const { settings } = useStore()
  const [note, setNote] = useState<Note | null>(null)
  const [content, setContent] = useState("")
  const [isPreview, setIsPreview] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [autoSaving, setAutoSaving] = useState(false)

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
        <header className="flex items-center gap-2 border-b border-border px-4 py-2">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="truncate text-sm font-medium">{note.title}</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {note.tags.length > 0 ? (
                note.tags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1">
                    <Hash className="size-3" />
                    {tag}
                  </span>
                ))
              ) : (
                <span>No tags</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant={isPreview ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setIsPreview(true)}
            >
              <Eye className="size-4" />
              Preview
            </Button>
            <Button
              variant={!isPreview ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setIsPreview(false)}
            >
              <Edit3 className="size-4" />
              Edit
            </Button>
            <Separator orientation="vertical" className="mx-1 h-6" />
            {autoSaving && (
              <span className="text-xs text-muted-foreground">Auto-saving...</span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-destructive hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="size-4" />
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
            >
              <Save className="size-4" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {isPreview ? (
            <div className="flex-1 overflow-hidden">
              <MarkdownPreview content={content} />
            </div>
          ) : (
            <div className="flex flex-1">
              <div className="flex-1 p-4">
                <MarkdownEditor
                  value={content}
                  onChange={handleContentChange}
                  onSave={handleSave}
                />
              </div>
              <Separator orientation="vertical" />
              <div className="flex-1 overflow-hidden">
                <MarkdownPreview content={content} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
