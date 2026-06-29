import type { Note, VaultEntry } from "@/types"

const API_BASE = "/api"

export async function listVault(path?: string): Promise<VaultEntry[]> {
  const params = path ? `?path=${encodeURIComponent(path)}` : ""
  const res = await fetch(`${API_BASE}/vault${params}`)
  if (!res.ok) throw new Error("Failed to list vault")
  return res.json()
}

export async function readNote(path: string): Promise<Note> {
  const res = await fetch(`${API_BASE}/notes?path=${encodeURIComponent(path)}`)
  if (!res.ok) throw new Error("Failed to read note")
  return res.json()
}

export async function saveNote(path: string, content: string): Promise<Note> {
  const res = await fetch(`${API_BASE}/notes`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, content }),
  })
  if (!res.ok) throw new Error("Failed to save note")
  return res.json()
}

export async function createNote(
  path: string,
  title: string
): Promise<Note> {
  const res = await fetch(`${API_BASE}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, title }),
  })
  if (!res.ok) throw new Error("Failed to create note")
  return res.json()
}

export async function deleteNote(path: string): Promise<void> {
  const res = await fetch(`${API_BASE}/notes?path=${encodeURIComponent(path)}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Failed to delete note")
}

export async function openVault(path: string): Promise<void> {
  await fetch(`${API_BASE}/vault`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
  })
}

export async function getSettings() {
  const res = await fetch(`${API_BASE}/settings`)
  if (!res.ok) throw new Error("Failed to get settings")
  return res.json()
}

export async function saveSettings(settings: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  })
  if (!res.ok) throw new Error("Failed to save settings")
  return res.json()
}
