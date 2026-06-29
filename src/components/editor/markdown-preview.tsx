"use client"

import { useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import rehypeHighlight from "rehype-highlight"
import { ScrollArea } from "@/components/ui/scroll-area"

interface MarkdownPreviewProps {
  content: string
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  return (
    <ScrollArea className="h-full">
      <div className="prose prose-sm dark:prose-invert max-w-none p-6">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, rehypeHighlight]}
        >
          {content}
        </ReactMarkdown>
      </div>
    </ScrollArea>
  )
}
