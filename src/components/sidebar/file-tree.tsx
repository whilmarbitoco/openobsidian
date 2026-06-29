"use client"

import { useEffect, useState } from "react"
import { useStore } from "@/store/useStore"
import { listVault, openVault, createNote } from "@/lib/vault"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  FileText,
  Folder,
  FolderOpen,
  Plus,
  File,
  ChevronRight,
  ChevronDown,
} from "lucide-react"
import type { VaultEntry } from "@/types"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

function FileTreeNode({
  entry,
  depth = 0,
  onSelect,
}: {
  entry: VaultEntry
  depth?: number
  onSelect: (path: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const isDir = entry.type === "directory"

  const handleClick = () => {
    if (isDir) {
      setExpanded(!expanded)
    } else {
      onSelect(entry.path)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        className={cn(
          "flex w-full items-center gap-2 rounded-sm px-2 py-1 text-sm hover:bg-accent hover:text-accent-foreground",
          "transition-colors text-left"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {isDir ? (
          expanded ? (
            <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
          )
        ) : (
          <span className="w-3.5" />
        )}
        {isDir ? (
          expanded ? (
            <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <Folder className="size-4 shrink-0 text-muted-foreground" />
          )
        ) : (
          <FileText className="size-4 shrink-0 text-muted-foreground" />
        )}
        <span className="truncate">{entry.name.replace(/\.md$/, "")}</span>
      </button>
      {isDir && expanded && entry.children && (
        <div>
          {entry.children.map((child) => (
            <FileTreeNode
              key={child.path}
              entry={child}
              depth={depth + 1}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function FileTree() {
  const { vaultStructure, setVaultStructure, settings } = useStore()
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (settings.vaultPath) {
      loadVault()
    }
  }, [settings.vaultPath])

  const loadVault = async () => {
    setLoading(true)
    try {
      const structure = await listVault()
      setVaultStructure(structure)
    } catch (err) {
      console.error("Failed to load vault:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectFile = (path: string) => {
    const id = encodeURIComponent(path)
    router.push(`/note/${id}`)
  }

  const handleNewNote = async () => {
    if (!settings.vaultPath) return
    const title = `note-${Date.now()}`
    try {
      const note = await createNote(settings.vaultPath, title)
      const id = encodeURIComponent(note.path)
      router.push(`/note/${id}`)
    } catch (err) {
      console.error("Failed to create note:", err)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Files
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          onClick={handleNewNote}
        >
          <Plus className="size-3.5" />
        </Button>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <div className="p-1">
          {loading ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Loading...
            </div>
          ) : vaultStructure.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {settings.vaultPath
                ? "No notes found"
                : "Open a vault to get started"}
            </div>
          ) : (
            vaultStructure.map((entry) => (
              <FileTreeNode
                key={entry.path}
                entry={entry}
                onSelect={handleSelectFile}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
