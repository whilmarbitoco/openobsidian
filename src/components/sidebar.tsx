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
      <div className="flex items-center justify-between px-3 py-3">
        <span className="text-[15px] font-semibold tracking-tight text-foreground">
          &#x25C7; OpenObsidian
        </span>
        <div className="flex items-center gap-1.5">
          <div
            className="flex items-center gap-1.5"
            title={
              aiConnected
                ? "DCMA Connected"
                : "DCMA Disconnected"
            }
          >
            <span
              className={cn(
                "inline-block size-1.5 rounded-full",
                aiConnected ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]" : "bg-red-500/60"
              )}
            />
            <span className="text-[10px] font-medium text-muted-foreground">
              {aiConnected ? "DCMA" : "Offline"}
            </span>
          </div>
          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              <PanelLeftClose className="size-3.5" />
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
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm",
                  isActive
                    ? "bg-accent-soft text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
                <span>{label}</span>
              </div>
            </Link>
          )
        })}
        <div className="mt-1 border-t border-border pt-1">
          <Link href="/settings">
            <div
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm",
                pathname === "/settings"
                  ? "bg-accent-soft text-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <Settings className="size-4" />
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
        <div className="flex h-11 items-center gap-2 border-b border-border bg-sidebar-background px-3 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-4" />
          </Button>
          <span className="text-[15px] font-semibold tracking-tight">
            &#x25C7; OpenObsidian
          </span>
          <div className="flex-1" />
          <div className="relative">
            <span
              className={cn(
                "absolute -right-0.5 -top-0.5 size-1.5 rounded-full",
                aiConnected ? "bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.5)]" : "bg-red-500/60"
              )}
            />
            <Link href="/settings">
              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground">
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
      <div className="flex h-full flex-col items-center gap-1.5 border-r border-border bg-sidebar-background py-2">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-foreground"
          onClick={() => setSidebarOpen(true)}
        >
          <PanelLeft className="size-4" />
        </Button>
        <Separator className="my-1" />
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
            <Activity className="size-4" />
          </Button>
        </Link>
        <Link href="/insights">
          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
            <Lightbulb className="size-4" />
          </Button>
        </Link>
        <Link href="/search">
          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
            <Search className="size-4" />
          </Button>
        </Link>
        <div className="flex-1" />
        <div className="relative">
          <span
            className={cn(
              "absolute -right-0.5 -top-0.5 size-1.5 rounded-full",
              aiConnected ? "bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.5)]" : "bg-red-500/60"
            )}
          />
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
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
