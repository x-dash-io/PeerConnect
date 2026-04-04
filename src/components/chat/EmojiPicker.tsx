"use client"

import { useEffect, useRef, useState, useMemo, useCallback, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { emojiCategories, type TelegramEmoji } from "@/lib/telegram-emojis"

interface EmojiPickerProps {
  open: boolean
  onClose: () => void
  onSelect: (emoji: TelegramEmoji) => void
}

export function EmojiPicker({ open, onClose, onSelect }: EmojiPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState("smileys")
  const [search, setSearch] = useState("")

  // Click outside
  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [open, onClose])

  // Escape
  useEffect(() => {
    if (!open) return
    function handle(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handle)
    return () => document.removeEventListener("keydown", handle)
  }, [open, onClose])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return null
    const results: TelegramEmoji[] = []
    for (const cat of emojiCategories) {
      for (const e of cat.emojis) {
        if (e.name.toLowerCase().includes(q)) results.push(e)
      }
    }
    return results
  }, [search])

  const activeCategoryEmojis = useMemo(
    () => emojiCategories.find((c) => c.id === activeTab)?.emojis ?? [],
    [activeTab],
  )

  const handleTabClick = useCallback((id: string) => {
    setActiveTab(id)
    setSearch("")
  }, [])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.15 }}
          className="absolute bottom-full right-0 mb-2 z-50 w-[340px] h-[380px] rounded-2xl bg-bg-surface border border-border-subtle shadow-xl flex flex-col overflow-hidden"
        >
          {/* Search */}
          <div className="px-3 pt-3 pb-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-text-low pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search emojis..."
                className="w-full h-8 pl-8 pr-8 text-xs bg-bg-muted rounded-lg border border-border-subtle text-text-high placeholder:text-text-low outline-none focus:border-brand/40 transition-colors"
                autoFocus
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-low hover:text-text-high"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Emoji grid — only active category or search results */}
          <div className="flex-1 overflow-y-auto px-2 pb-1 scrollbar-hide">
            {filtered ? (
              filtered.length > 0 ? (
                <div className="grid grid-cols-7 gap-0.5 p-1">
                  {filtered.map((emoji) => (
                    <EmojiButton key={`search:${emoji.name}`} emoji={emoji} onSelect={onSelect} />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-text-low text-xs">
                  No emojis found
                </div>
              )
            ) : (
              <>
                <div className="px-1.5 py-1.5">
                  <span className="text-[10px] font-semibold text-text-low uppercase tracking-wider">
                    {emojiCategories.find((c) => c.id === activeTab)?.label}
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-0.5 px-1 pb-2">
                  {activeCategoryEmojis.map((emoji) => (
                    <EmojiButton
                      key={`${activeTab}:${emoji.name}`}
                      emoji={emoji}
                      onSelect={onSelect}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Category tabs */}
          {!search.trim() && (
            <div className="shrink-0 flex items-center gap-0.5 px-2 py-1.5 border-t border-border-subtle bg-bg-surface">
              {emojiCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleTabClick(cat.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center h-7 rounded-lg text-sm transition-colors",
                    activeTab === cat.id
                      ? "bg-brand/10 text-brand"
                      : "text-text-low hover:text-text-high hover:bg-bg-muted",
                  )}
                  title={cat.label}
                >
                  {cat.icon}
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const EmojiButton = memo(function EmojiButton({
  emoji,
  onSelect,
}: {
  emoji: TelegramEmoji
  onSelect: (emoji: TelegramEmoji) => void
}) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: "80px" },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <button
      ref={ref}
      onClick={() => onSelect(emoji)}
      className="flex items-center justify-center size-10 rounded-lg hover:bg-bg-muted active:scale-90 transition-all"
      title={emoji.name}
    >
      {visible && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={emoji.src}
          alt={emoji.name}
          width={28}
          height={28}
          decoding="async"
          className="size-7 object-contain"
        />
      )}
    </button>
  )
})
