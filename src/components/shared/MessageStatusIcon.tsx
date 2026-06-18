"use client"

import { Check, CheckCheck, Loader2 } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { BubbleTheme } from "@/types"

const READ_COLORS: Record<BubbleTheme, string> = {
  indigo: "text-indigo-500",
  emerald: "text-emerald-500",
  violet: "text-violet-500",
  rose: "text-rose-500",
  amber: "text-amber-500",
  sky: "text-sky-500",
}

const READ_COLORS_LIGHT: Record<BubbleTheme, string> = {
  indigo: "text-white",
  emerald: "text-white",
  violet: "text-white",
  rose: "text-white",
  amber: "text-white",
  sky: "text-white",
}

type MessageStatus = "sending" | "sent" | "delivered" | "read"

interface MessageStatusIconProps {
  status: MessageStatus
  variant?: "default" | "light" | "inline"
  bubbleTheme?: BubbleTheme
}

export function MessageStatusIcon({
  status,
  variant = "default",
  bubbleTheme = "indigo",
}: MessageStatusIconProps) {
  const isLight = variant === "light" || variant === "inline"

  const config = {
    sending: {
      Icon: Loader2,
      className: cn("animate-spin", isLight ? "text-white/50" : "text-neutral-400"),
    },
    sent: {
      Icon: Check,
      className: isLight ? "text-white/60" : "text-neutral-400",
    },
    delivered: {
      Icon: CheckCheck,
      className: isLight ? "text-white/70" : "text-neutral-400",
    },
    read: {
      Icon: CheckCheck,
      className: isLight ? READ_COLORS_LIGHT[bubbleTheme] : READ_COLORS[bubbleTheme],
    },
  } as const

  const { Icon, className } = config[status]

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={status}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.15 }}
        className="inline-flex items-center"
      >
        <Icon size={12} strokeWidth={2.5} className={className} />
      </motion.span>
    </AnimatePresence>
  )
}
