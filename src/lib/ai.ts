export type EngineStatus = "connected" | "disconnected" | "checking"

export async function checkEngineHealth(): Promise<boolean> {
  try {
    const res = await fetch("/api/insights", {
      signal: AbortSignal.timeout(3000),
    })
    return res.ok
  } catch {
    return false
  }
}

export interface InsightConflict {
  id: string
  noteA: string
  noteB: string
  description: string
  detectedAt: string
}

export interface LinkSuggestion {
  id: string
  noteA: string
  noteB: string
  reason: string
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  citations?: { note: string; excerpt: string }[]
  timestamp: string
}

export async function fetchInsightConflicts(): Promise<InsightConflict[]> {
  const res = await fetch("/api/insight-conflicts", {
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) throw new Error("Failed to fetch insight conflicts")
  return res.json()
}

export async function fetchLinkSuggestions(): Promise<LinkSuggestion[]> {
  const res = await fetch("/api/link-suggestions", {
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) throw new Error("Failed to fetch link suggestions")
  return res.json()
}

export async function sendChatMessage(
  message: string,
  history: { role: string; content: string }[],
  onChunk: (chunk: string) => void,
  abortSignal?: AbortSignal
): Promise<void> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      history: history.slice(-10),
    }),
    signal: abortSignal,
  })

  if (!res.ok) throw new Error("Chat request failed")

  const contentType = res.headers.get("content-type") || ""

  if (contentType.includes("text/event-stream")) {
    const reader = res.body?.getReader()
    if (!reader) throw new Error("No response body")

    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const text = decoder.decode(value, { stream: true })
      for (const line of text.split("\n")) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6)
          if (data === "[DONE]") return
          try {
            const parsed = JSON.parse(data)
            if (parsed.content) onChunk(parsed.content)
          } catch {
            onChunk(data)
          }
        }
      }
    }
  } else {
    const data = await res.json()
    if (data.content) onChunk(data.content)
    else if (data.response) onChunk(data.response)
    else onChunk(JSON.stringify(data))
  }
}

const ENGINE_CHAT_HISTORY = "engine_chat_history"

export function loadChatHistory(): ChatMessage[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(ENGINE_CHAT_HISTORY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveChatHistory(messages: ChatMessage[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(ENGINE_CHAT_HISTORY, JSON.stringify(messages.slice(-100)))
  } catch {
    /* storage full, silently fail */
  }
}
