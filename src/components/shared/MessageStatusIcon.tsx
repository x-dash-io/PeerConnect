"use client"

import { Check, CheckCheck, Loader2 } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"

type MessageStatus = "sending" | "sent" | "delivered" | "read"

interface MessageStatusIconProps {
  status: MessageStatus
  variant?: "default" | "light" | "inline"
}

export function MessageStatusIcon({ status, variant = "default" }: MessageStatusIconProps) {
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
      className: isLight ? "text-white" : "text-indigo-500",
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
