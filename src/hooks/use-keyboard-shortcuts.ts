"use client"

import { useEffect } from "react"

type ShortcutHandler = (e: KeyboardEvent) => void

interface Shortcut {
  key: string
  meta?: boolean
  ctrl?: boolean
  handler: ShortcutHandler
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const metaKey = shortcut.meta ?? true
        const ctrlKey = shortcut.ctrl ?? false

        if (
          (metaKey ? e.metaKey : !e.metaKey) &&
          (ctrlKey ? e.ctrlKey : !e.ctrlKey) &&
          e.key.toLowerCase() === shortcut.key.toLowerCase()
        ) {
          e.preventDefault()
          e.stopPropagation()
          shortcut.handler(e)
          return
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [shortcuts])
}
