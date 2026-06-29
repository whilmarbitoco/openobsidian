"use client"

import { useEffect, useState } from "react"
import { useStore } from "@/store/useStore"
import { getSettings, saveSettings, openVault } from "@/lib/vault"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
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
        <div className="mx-auto max-w-2xl p-6">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Settings</h1>
          </div>

          <section className="mb-8">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <FolderOpen className="size-4" />
              Vault
            </h2>
            <Separator className="mb-4" />
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vaultPath">Vault Path</Label>
                <div className="flex gap-2">
                  <Input
                    id="vaultPath"
                    value={vaultPath}
                    onChange={(e) => setVaultPath(e.target.value)}
                    placeholder="/path/to/your/vault"
                    className="font-mono text-sm"
                  />
                  <Button onClick={handleOpenVault} variant="secondary">
                    <FolderOpen className="size-4" />
                    Open
                  </Button>
                </div>
                {vaultPath && (
                  <p className="font-mono text-xs text-muted-foreground">
                    {truncateMiddle(vaultPath)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Absolute path to a folder containing .md files
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              {theme === "dark" ? (
                <Moon className="size-4" />
              ) : (
                <Sun className="size-4" />
              )}
              Appearance
            </h2>
            <Separator className="mb-4" />
            <div className="flex items-center gap-4">
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                onClick={() => setTheme("dark")}
                className="gap-2"
              >
                <Moon className="size-4" />
                Dark
              </Button>
              <Button
                variant={theme === "light" ? "default" : "outline"}
                onClick={() => setTheme("light")}
                className="gap-2"
              >
                <Sun className="size-4" />
                Light
              </Button>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Server className="size-4" />
              AI Backend
            </h2>
            <Separator className="mb-4" />
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="aiBackendUrl">AI Backend Endpoint</Label>
                <Input
                  id="aiBackendUrl"
                  value={aiBackendUrl}
                  onChange={(e) => setAiBackendUrl(e.target.value)}
                  placeholder="http://localhost:8080"
                />
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Database className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">Status:</span>
                {testingBackend ? (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <RefreshCw className="size-3.5 animate-spin" />
                    Testing...
                  </span>
                ) : aiConnected ? (
                  <span className="flex items-center gap-1.5 text-green-500">
                    <span className="inline-block size-2 animate-pulse rounded-full bg-green-500" />
                    Connected
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="inline-block size-2 rounded-full bg-red-500/50" />
                    Disconnected
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={checkBackend}
                  disabled={testingBackend}
                  className="ml-2"
                >
                  <Wifi className="mr-1 size-3" />
                  {testingBackend ? "Testing..." : "Test Connection"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                The app works without an AI backend — shows basic links and full-text search.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Database className="size-4" />
              Index Stats
            </h2>
            <Separator className="mb-4" />
            {loadingStats ? (
              <div className="space-y-2">
                <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                <div className="h-5 w-28 animate-pulse rounded bg-muted" />
                <div className="h-5 w-40 animate-pulse rounded bg-muted" />
              </div>
            ) : stats ? (
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <FileText className="mx-auto mb-1 size-4 text-muted-foreground" />
                      <p className="text-lg font-bold tabular-nums">{stats.totalNotes}</p>
                      <p className="text-[10px] text-muted-foreground">Notes</p>
                    </div>
                    <div className="text-center">
                      <Link2 className="mx-auto mb-1 size-4 text-muted-foreground" />
                      <p className="text-lg font-bold tabular-nums">{stats.totalLinks}</p>
                      <p className="text-[10px] text-muted-foreground">Links</p>
                    </div>
                    <div className="text-center">
                      <Clock className="mx-auto mb-1 size-4 text-muted-foreground" />
                      <p className="text-lg font-bold tabular-nums">
                        {stats.lastReindex
                          ? new Date(stats.lastReindex).toLocaleDateString()
                          : "—"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Last reindex</p>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadStats}
                    >
                      <RefreshCw className="mr-1 size-3" />
                      Refresh Stats
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <p className="text-sm text-muted-foreground">
                Open a vault to see index statistics.
              </p>
            )}
          </section>

          <section className="mb-8 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-destructive">
              <AlertTriangle className="size-4" />
              Danger Zone
            </h2>
            <p className="mb-3 text-xs text-muted-foreground">
              Clear the search index and reindex from scratch. Your note files
              will not be affected.
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

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
