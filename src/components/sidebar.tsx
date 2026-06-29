"use client"

import { useStore } from "@/store/useStore"
import { FileTree } from "@/components/sidebar/file-tree"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  PanelLeftClose,
  PanelLeft,
  Settings,
  Search,
  Activity,
  Lightbulb,
  Menu,
  X,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { checkEngineHealth } from "@/lib/ai"
import { cn } from "@/lib/utils"

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen, aiConnected, setAiConnected } =
    useStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const check = async () => {
      const ok = await checkEngineHealth()
      setAiConnected(ok)
    }
    check()
    const interval = setInterval(check, 30000)
    return () => clearInterval(interval)
  }, [setAiConnected])

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches)
      if (e.matches) {
        setSidebarOpen(false)
      }
    }
    handler(mq)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [setSidebarOpen])

  const visible = isMobile ? mobileOpen : sidebarOpen

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Activity },
    { href: "/insights", label: "Insights", icon: Lightbulb },
    { href: "/search", label: "Search", icon: Search },
  ] as const

  const sidebarContent = (
    <>
      {isMobile && (
        <div className="flex items-center justify-between border-b border-border p-3">
          <span className="text-lg font-semibold tracking-tight">
            &#x25C7; OpenObsidian
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => setMobileOpen(false)}
          >
            <X className="size-4" />
          </Button>
        </div>
      )}
      <div className="flex items-center justify-between p-2">
        <span className="px-2 text-lg font-semibold tracking-tight">
          &#x25C7; OpenObsidian
        </span>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2 py-0.5",
              aiConnected
                ? "border-green-500/30 text-green-400"
                : "border-red-500/30 text-red-400"
            )}
            title={
              aiConnected
                ? "AI Backend Connected"
                : "AI Backend Disconnected"
            }
          >
            <span
              className={cn(
                "inline-block size-2 rounded-full",
                aiConnected ? "bg-green-500" : "bg-red-500"
              )}
            />
            <span className="text-[10px] font-medium">
              {aiConnected ? "DCMA" : "Offline"}
            </span>
          </div>
          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setSidebarOpen(false)}
            >
              <PanelLeftClose className="size-4" />
            </Button>
          )}
        </div>
      </div>
      <Separator />
      <div className="flex-1 overflow-hidden">
        <FileTree />
      </div>
      <Separator />
      <div className="flex flex-col gap-0.5 p-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link key={href} href={href}>
              <div
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "border-l-2 border-primary bg-accent-soft"
                    : "border-l-2 border-transparent hover:bg-accent/50"
                )}
              >
                <Icon className="size-4 text-muted-foreground" />
                <span>{label}</span>
              </div>
            </Link>
          )
        })}
        <div className="flex items-center gap-1">
          <Link href="/settings" className="flex-1">
            <div
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                pathname === "/settings"
                  ? "border-l-2 border-primary bg-accent-soft"
                  : "border-l-2 border-transparent hover:bg-accent/50"
              )}
            >
              <Settings className="size-4 text-muted-foreground" />
              <span>Settings</span>
            </div>
          </Link>
        </div>
      </div>
    </>
  )

  if (isMobile) {
    return (
      <>
        <div className="flex h-12 items-center gap-2 border-b border-border bg-sidebar-background px-3 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-4" />
          </Button>
          <span className="text-lg font-semibold tracking-tight">
            &#x25C7; OpenObsidian
          </span>
          <div className="flex-1" />
          <div className="relative">
            <span
              className={cn(
                "absolute -right-0.5 -top-0.5 size-2 rounded-full border-2 border-sidebar-background",
                aiConnected ? "bg-green-500" : "bg-red-500"
              )}
            />
            <Link href="/settings">
              <Button variant="ghost" size="icon" className="size-8">
                <Settings className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
        {mobileOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50"
              onClick={() => setMobileOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-sidebar-background shadow-xl">
              {sidebarContent}
            </div>
          </>
        )}
      </>
    )
  }

  if (!sidebarOpen) {
    return (
      <div className="flex h-full flex-col items-center gap-2 border-r border-border bg-sidebar-background p-2">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => setSidebarOpen(true)}
        >
          <PanelLeft className="size-4" />
        </Button>
        <Separator />
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="size-8">
            <Activity className="size-4" />
          </Button>
        </Link>
        <Link href="/insights">
          <Button variant="ghost" size="icon" className="size-8">
            <Lightbulb className="size-4" />
          </Button>
        </Link>
        <Link href="/search">
          <Button variant="ghost" size="icon" className="size-8">
            <Search className="size-4" />
          </Button>
        </Link>
        <div className="flex-1" />
        <div className="relative">
          <span
            className={cn(
              "absolute -right-0.5 -top-0.5 size-2 rounded-full border-2 border-sidebar-background",
              aiConnected ? "bg-green-500" : "bg-red-500"
            )}
          />
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="size-8">
              <Settings className="size-4" />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-sidebar-background">
      {sidebarContent}
    </div>
  )
}
