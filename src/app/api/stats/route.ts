import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    const database = getDb()

    const noteCount = database
      .prepare("SELECT COUNT(*) as count FROM note_metadata")
      .get() as { count: number }

    const linkCount = database
      .prepare(
        "SELECT SUM(json_array_length(links)) as total FROM note_metadata"
      )
      .get() as { total: number | null }

    const lastReindex = database
      .prepare(
        "SELECT MAX(updated_at) as last FROM note_metadata"
      )
      .get() as { last: string | null }

    return NextResponse.json({
      totalNotes: noteCount.count,
      totalLinks: linkCount.total ?? 0,
      lastReindex: lastReindex.last ?? null,
    })
  } catch (error) {
    console.error("Stats error:", error)
    return NextResponse.json(
      { error: "Failed to get stats" },
      { status: 500 }
    )
  }
}
