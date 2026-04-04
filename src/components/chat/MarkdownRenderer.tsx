"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"
import type { Components } from "react-markdown"

interface MarkdownRendererProps {
  content: string
  isSelf?: boolean
}

export function MarkdownRenderer({ content, isSelf }: MarkdownRendererProps) {
  const components: Components = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    code: ({ inline, children, ...props }: any) =>
      inline ? (
        <code
          className={cn(
            "font-mono text-sm px-1 py-0.5 rounded",
            isSelf ? "bg-white/10 text-white" : "bg-bg-muted text-brand",
          )}
          {...props}
        >
          {children}
        </code>
      ) : (
        <pre
          className={cn(
            "font-mono text-sm p-3 rounded-lg overflow-x-auto my-2",
            isSelf ? "bg-white/10" : "bg-bg-muted",
          )}
        >
          <code {...props}>{children}</code>
        </pre>
      ),
    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    blockquote: ({ children }) => (
      <blockquote
        className={cn(
          "border-l-2 pl-3 my-1 italic",
          isSelf ? "border-white/40 text-white/80" : "border-brand text-text-medium",
        )}
      >
        {children}
      </blockquote>
    ),
    p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    img: ({ src, alt }: any) => {
      const isTelegramEmoji = typeof src === "string" && src.includes("Telegram-Animated-Emojis")
      if (isTelegramEmoji) {
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt ?? "emoji"}
            width={24}
            height={24}
            className="inline-block size-6 align-text-bottom mx-0.5"
            loading="lazy"
          />
        )
      }
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt ?? ""} className="max-w-full rounded-lg my-1" loading="lazy" />
      )
    },
  }

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  )
}
