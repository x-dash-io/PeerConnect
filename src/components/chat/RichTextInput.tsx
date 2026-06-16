"use client"

import { forwardRef, useImperativeHandle, useRef, useCallback } from "react"
import type { KeyboardEvent, ClipboardEvent } from "react"
import { cn } from "@/lib/utils"

export interface RichTextInputHandle {
  insertEmoji: (char: string) => void
  focus: () => void
  clear: () => void
  setValue: (text: string) => void
}

interface RichTextInputProps {
  onChange: (markdown: string) => void
  onKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void
  placeholder?: string
  className?: string
}

/** Walk the contenteditable DOM and produce the markdown string. */
function extractMarkdown(el: HTMLElement): string {
  let result = ""
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      result += node.textContent ?? ""
    } else if (node.nodeName === "IMG") {
      const img = node as HTMLImageElement
      result += `![${img.dataset.emojiName}](${img.dataset.emojiSrc})`
    } else if (node.nodeName === "BR") {
      result += "\n"
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // div / p inserted by the browser on Enter
      const inner = extractMarkdown(node as HTMLElement)
      result += (result.length > 0 ? "\n" : "") + inner
    }
  }
  return result
}

export const RichTextInput = forwardRef<RichTextInputHandle, RichTextInputProps>(
  function RichTextInput({ onChange, onKeyDown, placeholder, className }, ref) {
    const divRef = useRef<HTMLDivElement>(null)
    const savedRange = useRef<Range | null>(null)

    /** Save caret before focus leaves (e.g. emoji picker opens). */
    const saveSelection = useCallback(() => {
      const sel = window.getSelection()
      if (sel && sel.rangeCount > 0) {
        savedRange.current = sel.getRangeAt(0).cloneRange()
      }
    }, [])

    /** Restore caret after focus returns. */
    const restoreSelection = useCallback(() => {
      const el = divRef.current
      if (!el) return
      el.focus()
      const sel = window.getSelection()
      if (!sel) return
      sel.removeAllRanges()
      if (savedRange.current) {
        sel.addRange(savedRange.current)
      } else {
        // Fall back: place cursor at end
        const range = document.createRange()
        range.selectNodeContents(el)
        range.collapse(false)
        sel.addRange(range)
      }
    }, [])

    const adjustHeight = useCallback(() => {
      const el = divRef.current
      if (!el) return
      el.style.height = "auto"
      el.style.height = Math.min(el.scrollHeight, 120) + "px"
    }, [])

    useImperativeHandle(ref, () => ({
      focus() {
        divRef.current?.focus()
      },
      clear() {
        const el = divRef.current
        if (!el) return
        el.innerHTML = ""
        onChange("")
        adjustHeight()
      },
      setValue(text: string) {
        const el = divRef.current
        if (!el) return
        el.textContent = text
        onChange(text)
        adjustHeight()
      },
      insertEmoji(char: string) {
        restoreSelection()

        const el = divRef.current
        if (!el) return

        const sel = window.getSelection()
        let range: Range

        if (sel && sel.rangeCount > 0 && el.contains(sel.anchorNode)) {
          range = sel.getRangeAt(0)
        } else {
          // No valid caret — append to end
          range = document.createRange()
          range.selectNodeContents(el)
          range.collapse(false)
          sel?.removeAllRanges()
          sel?.addRange(range)
        }

        range.deleteContents()

        const textNode = document.createTextNode(char)
        range.insertNode(textNode)
        range.setStartAfter(textNode)
        range.collapse(true)
        sel?.removeAllRanges()
        sel?.addRange(range)

        onChange(extractMarkdown(el))
        adjustHeight()
      },
    }))

    const handleInput = useCallback(() => {
      const el = divRef.current
      if (!el) return
      onChange(extractMarkdown(el))
      adjustHeight()
    }, [onChange, adjustHeight])

    /** Strip HTML on paste — only allow plain text. */
    const handlePaste = useCallback(
      (e: ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault()
        const text = e.clipboardData.getData("text/plain")
        if (!text) return
        const sel = window.getSelection()
        if (!sel?.rangeCount) return
        const range = sel.getRangeAt(0)
        range.deleteContents()
        range.insertNode(document.createTextNode(text))
        range.collapse(false)
        sel.removeAllRanges()
        sel.addRange(range)
        const el = divRef.current
        if (el) {
          onChange(extractMarkdown(el))
          adjustHeight()
        }
      },
      [onChange, adjustHeight],
    )

    return (
      <div
        ref={divRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={onKeyDown}
        onBlur={saveSelection}
        onPaste={handlePaste}
        data-placeholder={placeholder ?? "Write a message..."}
        className={cn(
          "rich-input w-full bg-bg-deep rounded-xl px-4 py-2.5 text-sm text-text-high outline-none border border-border-main focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all overflow-y-auto scrollbar-hide leading-relaxed break-words",
          className,
        )}
        style={{ minHeight: 44, maxHeight: 120 }}
      />
    )
  },
)
