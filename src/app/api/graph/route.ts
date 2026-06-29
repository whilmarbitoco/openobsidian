import { NextResponse } from "next/server"
import { getGraphData } from "@/lib/db"

export async function GET() {
  try {
    const data = getGraphData()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Graph error:", error)
    return NextResponse.json(
      { error: "Failed to get graph data" },
      { status: 500 }
    )
  }
}
