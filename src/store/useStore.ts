"use client"

import { create } from "zustand"
import type { Note, VaultEntry, AppSettings } from "@/types"

interface AppState {
  notes: Note[]
  currentNote: Note | null
  vaultStructure: VaultEntry[]
  settings: AppSettings
  isLoading: boolean
  sidebarOpen: boolean
  aiConnected: boolean
  commandPaletteOpen: boolean

  setNotes: (notes: Note[]) => void
  setCurrentNote: (note: Note | null) => void
  setVaultStructure: (structure: VaultEntry[]) => void
  setSettings: (settings: AppSettings) => void
  setLoading: (loading: boolean) => void
  setSidebarOpen: (open: boolean) => void
  setAiConnected: (connected: boolean) => void
  setCommandPaletteOpen: (open: boolean) => void
}

export const useStore = create<AppState>((set) => ({
  notes: [],
  currentNote: null,
  vaultStructure: [],
  settings: {
    vaultPath: "",
    theme: "dark",
    aiBackendUrl: "",
  },
  isLoading: false,
  sidebarOpen: true,
  aiConnected: false,
  commandPaletteOpen: false,

  setNotes: (notes) => set({ notes }),
  setCurrentNote: (note) => set({ currentNote: note }),
  setVaultStructure: (structure) => set({ vaultStructure: structure }),
  setSettings: (settings) => set({ settings }),
  setLoading: (loading) => set({ isLoading: loading }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setAiConnected: (connected) => set({ aiConnected: connected }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
}))
