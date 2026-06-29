import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import type { VaultEntry } from "@/types"

let vaultPath: string | null = null

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const dirPath = searchParams.get("path") || vaultPath

    if (!dirPath) {
      return NextResponse.json([])
    }

    const absolutePath = path.resolve(dirPath)
    if (!fs.existsSync(absolutePath)) {
      return NextResponse.json([])
    }

    const entries = fs.readdirSync(absolutePath, { withFileTypes: true })
    const result: VaultEntry[] = []

    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue

      const fullPath = path.join(absolutePath, entry.name)

      if (entry.isDirectory()) {
        const children = readDirectory(fullPath)
        result.push({
          name: entry.name,
          path: fullPath,
          type: "directory",
          children,
        })
      } else if (entry.name.endsWith(".md")) {
        result.push({
          name: entry.name,
          path: fullPath,
          type: "file",
        })
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Vault list error:", error)
    return NextResponse.json(
      { error: "Failed to list vault" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { path: newPath } = body

    if (!newPath || !fs.existsSync(newPath)) {
      return NextResponse.json(
        { error: "Invalid vault path" },
        { status: 400 }
      )
    }

    vaultPath = newPath
    return NextResponse.json({ success: true, path: newPath })
  } catch (error) {
    console.error("Open vault error:", error)
    return NextResponse.json(
      { error: "Failed to open vault" },
      { status: 500 }
    )
  }
}

function readDirectory(dirPath: string): VaultEntry[] {
  const entries: VaultEntry[] = []
  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true })
    for (const item of items) {
      if (item.name.startsWith(".")) continue
      const fullPath = path.join(dirPath, item.name)
      if (item.isDirectory()) {
        const children = readDirectory(fullPath)
        entries.push({
          name: item.name,
          path: fullPath,
          type: "directory",
          children,
        })
      } else if (item.name.endsWith(".md")) {
        entries.push({
          name: item.name,
          path: fullPath,
          type: "file",
        })
      }
    }
  } catch {
    // skip unreadable directories
  }
  return entries
}
