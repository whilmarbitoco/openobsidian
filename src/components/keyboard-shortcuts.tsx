"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { useStore } from "@/store/useStore"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { CommandPalette } from "@/components/command-palette"
import { createNote } from "@/lib/vault"
import { toast } from "sonner"

export function KeyboardShortcuts({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const {
    sidebarOpen,
    setSidebarOpen,
    commandPaletteOpen,
    setCommandPaletteOpen,
    settings,
  } = useStore()

  const handleNewNote = useCallback(async () => {
    if (!settings.vaultPath) {
      toast.error("Open a vault first")
      return
    }
    try {
      const note = await createNote(settings.vaultPath, "Untitled")
      router.push(`/note/${encodeURIComponent(note.path)}`)
      toast.success("New note created")
    } catch {
      toast.error("Failed to create note")
    }
  }, [settings.vaultPath, router])

  useKeyboardShortcuts([
    {
      key: "k",
      meta: true,
      handler: () => setCommandPaletteOpen(true),
    },
    {
      key: "n",
      meta: true,
      handler: handleNewNote,
    },
    {
      key: "/",
      meta: true,
      handler: () => setSidebarOpen(!sidebarOpen),
    },
  ])

  return (
    <>
      {children}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />
    </>
  )
}
