import { NextRequest, NextResponse } from "next/server"
import { searchNotes } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q")
    if (!q || !q.trim()) {
      return NextResponse.json([])
    }

    const ftsQuery = q
      .trim()
      .split(/\s+/)
      .map((term) => `"${term}"*`)
      .join(" AND ")

    const results = searchNotes(ftsQuery)
    return NextResponse.json(results)
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    )
  }
}
