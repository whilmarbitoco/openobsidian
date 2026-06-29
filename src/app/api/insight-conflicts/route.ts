import { NextResponse } from "next/server"

const AI_BACKEND_URL = process.env.AI_BACKEND_URL || ""

export async function GET() {
  if (!AI_BACKEND_URL) {
    return NextResponse.json(
      { error: "AI backend not configured" },
      { status: 503 }
    )
  }
  try {
    const res = await fetch(`${AI_BACKEND_URL}/api/contradictions`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) {
      return NextResponse.json(
        { error: "AI backend unavailable" },
        { status: 503 }
      )
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: "AI backend unreachable" },
      { status: 503 }
    )
  }
}
