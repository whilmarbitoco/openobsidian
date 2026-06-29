"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { EditorView, basicSetup } from "codemirror"
import { EditorState } from "@codemirror/state"
import { markdown, markdownLanguage } from "@codemirror/lang-markdown"
import { languages } from "@codemirror/language-data"
import { oneDark } from "@codemirror/theme-one-dark"
import { keymap } from "@codemirror/view"
import { indentWithTab } from "@codemirror/commands"
import { useTheme } from "next-themes"

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  onSave?: () => void
}

export function MarkdownEditor({ value, onChange, onSave }: MarkdownEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const { theme } = useTheme()

  const handleChange = useCallback(
    (v: string) => {
      onChange(v)
    },
    [onChange]
  )

  useEffect(() => {
    if (!editorRef.current) return

    const saveKeymap = keymap.of([
      {
        key: "Mod-s",
        run: () => {
          onSave?.()
          return true
        },
      },
      indentWithTab,
    ])

    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        theme === "dark" ? oneDark : [],
        saveKeymap,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            handleChange(update.state.doc.toString())
          }
        }),
      ],
    })

    const view = new EditorView({
      state,
      parent: editorRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [theme])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return

    const currentContent = view.state.doc.toString()
    if (value !== currentContent) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentContent.length,
          insert: value,
        },
      })
    }
  }, [value])

  return (
    <div className="h-full w-full overflow-hidden rounded-md border border-input">
      <div ref={editorRef} className="h-full [&_.cm-editor]:h-full [&_.cm-scroller]:overflow-auto [&_.cm-editor]:text-base" />
    </div>
  )
}
