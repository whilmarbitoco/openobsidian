"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Bot, Send, X, User, MessageSquare, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  sendChatMessage,
  loadChatHistory,
  saveChatHistory,
  type ChatMessage,
} from "@/lib/ai"

export function ChatPanel() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState("")
  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (open) {
      const history = loadChatHistory()
      setMessages(history)
    }
  }, [open])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streamingContent])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return

    setInput("")
    setLoading(true)
    setStreamingContent("")

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)

    let fullResponse = ""
    abortRef.current = new AbortController()

    try {
      await sendChatMessage(
        text,
        updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        (chunk) => {
          fullResponse += chunk
          setStreamingContent(fullResponse)
        },
        abortRef.current.signal
      )

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: fullResponse,
        citations: extractCitations(fullResponse),
        timestamp: new Date().toISOString(),
      }

      const finalMessages = [...updatedMessages, assistantMessage]
      setMessages(finalMessages)
      setStreamingContent("")
      saveChatHistory(finalMessages)
    } catch (err) {
      if ((err as Error).name === "AbortError") return
      toast.error("Failed to get response from AI backend")
      setStreamingContent("")
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }, [input, loading, messages])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    if (e.key === "Escape") {
      setOpen(false)
    }
  }

  const handleCancel = () => {
    abortRef.current?.abort()
    setLoading(false)
    setStreamingContent("")
  }

  const handleCitationClick = (notePath: string) => {
    setOpen(false)
    router.push(`/note/${encodeURIComponent(notePath)}`)
  }

  const handleClearHistory = () => {
    setMessages([])
    saveChatHistory([])
    toast.success("Chat history cleared")
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-6 right-6 z-40 size-12 rounded-full shadow-lg"
        >
          <MessageSquare className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="flex flex-row items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Bot className="size-5 text-primary" />
            <SheetTitle className="text-sm font-semibold">
              AI Chat
            </SheetTitle>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={handleClearHistory}
              >
                Clear
              </Button>
            )}
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7">
                <X className="size-4" />
              </Button>
            </SheetTrigger>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef}>
          {messages.length === 0 && !loading ? (
            <div className="flex h-full flex-col items-center justify-center py-12 text-center">
              <Bot className="mb-3 size-10 text-muted-foreground/50" />
              <p className="text-sm font-medium text-muted-foreground">
                Ask about your notes
              </p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                I can help you find patterns, connections, and insights in your
                knowledge base.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    msg.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <User className="size-4" />
                    ) : (
                      <Bot className="size-4" />
                    )}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-2 border-t border-border/50 pt-2">
                        <p className="mb-1 text-xs text-muted-foreground">
                          Sources:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {msg.citations.map((cit, i) => (
                            <button
                              key={i}
                              onClick={() => handleCitationClick(cit.note)}
                              className="rounded bg-background/50 px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {cit.note.split("/").pop()?.replace(".md", "") ||
                                cit.note}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && streamingContent && (
                <div className="flex gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Bot className="size-4" />
                  </div>
                  <div className="max-w-[80%] rounded-lg bg-muted px-3 py-2 text-sm text-foreground">
                    <p className="whitespace-pre-wrap">{streamingContent}</p>
                    <span className="inline-block size-1.5 animate-pulse rounded-full bg-foreground/50" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="border-t border-border p-4">
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your notes..."
              className="min-h-[44px] resize-none"
              rows={1}
              disabled={loading}
            />
            {loading ? (
              <Button
                size="icon"
                variant="destructive"
                className="size-11 shrink-0"
                onClick={handleCancel}
              >
                <Loader2 className="size-4 animate-spin" />
              </Button>
            ) : (
              <Button
                size="icon"
                className="size-11 shrink-0"
                onClick={handleSend}
                disabled={!input.trim()}
              >
                <Send className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function extractCitations(
  text: string
): { note: string; excerpt: string }[] {
  const citations: { note: string; excerpt: string }[] = []
  const regex = /\[\[([^\]]+)\]\]/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    citations.push({
      note: match[1].trim(),
      excerpt: text.slice(Math.max(0, match.index - 40), match.index + match[0].length + 40).trim(),
    })
  }
  return citations
}
