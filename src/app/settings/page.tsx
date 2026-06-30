"use client"

import { useEffect, useState } from "react"
import { useStore } from "@/store/useStore"
import { getSettings, saveSettings, openVault } from "@/lib/vault"
import { cn } from "@/lib/utils"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import {
  FolderOpen,
  Database,
  Sun,
  Moon,
  Server,
  FileText,
  Link2,
  Clock,
  Wifi,
  RefreshCw,
  AlertTriangle,
  Trash2,
} from "lucide-react"

function truncateMiddle(path: string, maxLen: number = 40): string {
  if (path.length <= maxLen) return path
  const half = Math.floor((maxLen - 3) / 2)
  return path.slice(0, half) + "..." + path.slice(path.length - half)
}

export default function SettingsPage() {
  const { settings, setSettings, aiConnected, setAiConnected } = useStore()
  const { theme, setTheme } = useTheme()
  const [vaultPath, setVaultPath] = useState(settings.vaultPath)
  const [aiBackendUrl, setAiBackendUrl] = useState(settings.aiBackendUrl)
  const [saving, setSaving] = useState(false)
  const [testingBackend, setTestingBackend] = useState(false)
  const [stats, setStats] = useState<{
    totalNotes: number
    totalLinks: number
    lastReindex: string | null
  } | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  useEffect(() => {
    loadSettings()
    checkBackend()
    loadStats()
  }, [])

  const loadSettings = async () => {
    try {
      const data = await getSettings()
      setSettings(data)
      setVaultPath(data.vaultPath || "")
      setAiBackendUrl(data.aiBackendUrl || "")
    } catch (err) {
      console.error("Failed to load settings:", err)
    }
  }

  const checkBackend = async () => {
    setTestingBackend(true)
    try {
      const res = await fetch("/api/insights", {
        signal: AbortSignal.timeout(3000),
      })
      setAiConnected(res.ok)
      if (res.ok) {
        toast.success("AI Backend is connected")
      } else {
        toast.error("AI Backend responded with an error")
      }
    } catch {
      setAiConnected(false)
      toast.error("Could not connect to AI Backend")
    } finally {
      setTestingBackend(false)
    }
  }

  const loadStats = async () => {
    setLoadingStats(true)
    try {
      const res = await fetch("/api/stats")
      if (res.ok) {
        setStats(await res.json())
      }
    } catch {
      /* silently fail */
    } finally {
      setLoadingStats(false)
    }
  }

  const handleOpenVault = async () => {
    if (!vaultPath) {
      toast.error("Please enter a vault path")
      return
    }
    try {
      await openVault(vaultPath)
      setSettings({ ...settings, vaultPath })
      toast.success("Vault opened successfully")
      loadStats()
    } catch {
      toast.error("Failed to open vault")
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveSettings({ vaultPath, aiBackendUrl, theme })
      setSettings({ ...settings, vaultPath, aiBackendUrl })
      toast.success("Settings saved")
    } catch {
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const handleClearIndex = async () => {
    try {
      const res = await fetch("/api/reindex", { method: "POST" })
      if (res.ok) {
        toast.success("Index cleared and reindexing started")
        loadStats()
      } else {
        toast.error("Failed to clear index")
      }
    } catch {
      toast.error("Failed to clear index")
    }
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-2xl p-8">
          <h1 className="mb-8 text-2xl font-bold tracking-tight">Settings</h1>

          <section className="mb-10">
            <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold tracking-tight">
              <FolderOpen className="size-4 text-muted-foreground" />
              Vault
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Open a folder containing .md files to build your knowledge graph.
            </p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="vaultPath" className="text-xs font-medium text-muted-foreground">Path</Label>
                <div className="flex gap-2">
                  <Input
                    id="vaultPath"
                    value={vaultPath}
                    onChange={(e) => setVaultPath(e.target.value)}
                    placeholder="/path/to/your/vault"
                    className="font-mono text-sm"
                  />
                  <Button onClick={handleOpenVault} variant="secondary">
                    <FolderOpen className="size-3.5" />
                    Open
                  </Button>
                </div>
                {vaultPath && (
                  <p className="font-mono text-xs text-muted-foreground">
                    {truncateMiddle(vaultPath)}
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold tracking-tight">
              {theme === "dark" ? (
                <Moon className="size-4 text-muted-foreground" />
              ) : (
                <Sun className="size-4 text-muted-foreground" />
              )}
              Appearance
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Choose how OpenObsidian looks.
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                onClick={() => setTheme("dark")}
                className="gap-2"
                size="sm"
              >
                <Moon className="size-3.5" />
                Dark
              </Button>
              <Button
                variant={theme === "light" ? "default" : "outline"}
                onClick={() => setTheme("light")}
                className="gap-2"
                size="sm"
              >
                <Sun className="size-3.5" />
                Light
              </Button>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold tracking-tight">
              <Server className="size-4 text-muted-foreground" />
              AI Backend
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              DCMA unlocks conflict detection, link suggestions, and knowledge chat. It runs locally on your machine.
            </p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="aiBackendUrl" className="text-xs font-medium text-muted-foreground">Endpoint</Label>
                <Input
                  id="aiBackendUrl"
                  value={aiBackendUrl}
                  onChange={(e) => setAiBackendUrl(e.target.value)}
                  placeholder="http://localhost:3030"
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-block size-2 rounded-full",
                      aiConnected ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]" : "bg-red-500/60"
                    )}
                  />
                  <span className="text-sm">
                    {testingBackend ? (
                      <span className="text-muted-foreground">Testing...</span>
                    ) : aiConnected ? (
                      <span className="text-green-500">Connected</span>
                    ) : (
                      <span className="text-muted-foreground">Disconnected</span>
                    )}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={checkBackend}
                  disabled={testingBackend}
                  className="h-7 px-2 text-xs"
                >
                  <Wifi className="mr-1 size-3" />
                  {testingBackend ? "Testing..." : "Test"}
                </Button>
              </div>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold tracking-tight">
              <Database className="size-4 text-muted-foreground" />
              Index
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Statistics about your vault&apos;s search index.
            </p>
            {loadingStats ? (
              <div className="space-y-2">
                <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                <div className="h-5 w-28 animate-pulse rounded bg-muted" />
              </div>
            ) : stats ? (
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-border bg-card p-4 text-center">
                  <FileText className="mx-auto mb-1.5 size-4 text-muted-foreground" />
                  <p className="text-2xl font-bold tabular-nums">{stats.totalNotes}</p>
                  <p className="mt-0.5 text-xs font-medium text-muted-foreground">Notes</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 text-center">
                  <Link2 className="mx-auto mb-1.5 size-4 text-muted-foreground" />
                  <p className="text-2xl font-bold tabular-nums">{stats.totalLinks}</p>
                  <p className="mt-0.5 text-xs font-medium text-muted-foreground">Links</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 text-center">
                  <Clock className="mx-auto mb-1.5 size-4 text-muted-foreground" />
                  <p className="text-2xl font-bold tabular-nums">
                    {stats.lastReindex
                      ? new Date(stats.lastReindex).toLocaleDateString()
                      : "—"}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-muted-foreground">Reindexed</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Open a vault to see index statistics.
              </p>
            )}
          </section>

          <section className="rounded-xl border border-destructive/20 bg-destructive/5 p-5">
            <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-destructive">
              <AlertTriangle className="size-4" />
              Danger Zone
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Clear the search index and reindex from scratch. Your note files will not be affected.
            </p>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearIndex}
            >
              <Trash2 className="mr-1.5 size-3.5" />
              Clear Index
            </Button>
          </section>

          <div className="mt-10 flex justify-end border-t border-border pt-6">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
