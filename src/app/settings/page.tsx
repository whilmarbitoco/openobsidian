"use client"

import { useEffect, useState } from "react"
import { useStore } from "@/store/useStore"
import { getSettings, saveSettings, openVault } from "@/lib/vault"
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
  CheckCircle2,
  XCircle,
  RefreshCw,
  FileText,
  Link2,
  Clock,
  Wifi,
} from "lucide-react"

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
                  />
                  <Button onClick={handleOpenVault} variant="secondary">
                    <FolderOpen className="size-4" />
                    Open
                  </Button>
                </div>
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
                <Database className="size-4" />
                <span>Status:</span>
                {aiConnected ? (
                  <span className="flex items-center gap-1 text-green-500">
                    <CheckCircle2 className="size-4" />
                    Connected
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <XCircle className="size-4" />
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
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Total notes:</span>
                  <span className="font-medium">{stats.totalNotes}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Link2 className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Total links:</span>
                  <span className="font-medium">{stats.totalLinks}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Last reindex:</span>
                  <span className="font-medium">
                    {stats.lastReindex
                      ? new Date(stats.lastReindex).toLocaleString()
                      : "Never"}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadStats}
                  className="mt-2"
                >
                  <RefreshCw className="mr-1 size-3" />
                  Refresh Stats
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Open a vault to see index statistics.
              </p>
            )}
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
