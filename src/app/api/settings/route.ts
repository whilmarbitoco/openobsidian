import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const SETTINGS_PATH = path.join(process.cwd(), ".openobsidian", "settings.json")

function ensureDir() {
  const dir = path.dirname(SETTINGS_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function readSettings(): Record<string, unknown> {
  ensureDir()
  if (!fs.existsSync(SETTINGS_PATH)) {
    return {
      vaultPath: "",
      theme: "dark",
      aiBackendUrl: "",
    }
  }
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf-8"))
  } catch {
    return {
      vaultPath: "",
      theme: "dark",
      aiBackendUrl: "",
    }
  }
}

function writeSettings(data: Record<string, unknown>) {
  ensureDir()
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(data, null, 2), "utf-8")
}

export async function GET() {
  try {
    const settings = readSettings()
    return NextResponse.json(settings)
  } catch (error) {
    console.error("Settings error:", error)
    return NextResponse.json(
      { error: "Failed to read settings" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const current = readSettings()
    const updated = { ...current, ...body }
    writeSettings(updated)
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Settings error:", error)
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    )
  }
}
