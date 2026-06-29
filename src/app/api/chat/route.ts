import { NextRequest } from "next/server"

const AI_BACKEND_URL = process.env.AI_BACKEND_URL || ""

export async function POST(request: NextRequest) {
  if (!AI_BACKEND_URL) {
    return new Response(
      JSON.stringify({ error: "AI backend not configured" }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    )
  }

  try {
    const { message, history } = await request.json()

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const backendRes = await fetch(`${AI_BACKEND_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        history: (history || []).slice(-10),
      }),
    })

    if (!backendRes.ok) {
      const errorBody = await backendRes.text()
      return new Response(
        JSON.stringify({
          error: `AI backend returned ${backendRes.status}`,
          detail: errorBody,
        }),
        {
          status: backendRes.status,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    const contentType = backendRes.headers.get("content-type") || ""

    if (contentType.includes("text/event-stream")) {
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        async start(controller) {
          const reader = backendRes.body?.getReader()
          if (!reader) {
            controller.close()
            return
          }
          const decoder = new TextDecoder()

          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              const text = decoder.decode(value, { stream: true })
              controller.enqueue(encoder.encode(text))
            }
          } catch {
            /* stream ended */
          } finally {
            controller.close()
          }
        },
      })

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      })
    }

    const data = await backendRes.json()
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Chat proxy error:", error)
    return new Response(
      JSON.stringify({ error: "Failed to reach AI backend chat" }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}
