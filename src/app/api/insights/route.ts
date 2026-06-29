import { NextResponse } from "next/server"

const AI_BACKEND_URL = process.env.AI_BACKEND_URL || ""

export async function GET() {
  if (!AI_BACKEND_URL) return NextResponse.json({ status: "disconnected" }, { status: 503 })
  try {
    const res = await fetch(`${AI_BACKEND_URL}/api/health`, {
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) {
      return NextResponse.json({ status: "disconnected" }, { status: 503 })
    }
    return NextResponse.json({ status: "connected" })
  } catch {
    return NextResponse.json({ status: "disconnected" }, { status: 503 })
  }
}
