"use client"

import { Check, CheckCheck, Loader2 } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"

type MessageStatus = "sending" | "sent" | "delivered" | "read"

interface MessageStatusIconProps {
  status: MessageStatus
  variant?: "default" | "light"
}

export function MessageStatusIcon({ status, variant = "default" }: MessageStatusIconProps) {
  const isLight = variant === "light"

  const config = {
    sending: {
      Icon: Loader2,
      className: cn("animate-spin", isLight ? "text-white/50" : "text-text-low"),
    },
    sent: {
      Icon: Check,
      className: isLight ? "text-white/70" : "text-text-medium",
    },
    delivered: {
      Icon: CheckCheck,
      className: isLight ? "text-white/70" : "text-text-medium",
    },
    read: {
      Icon: CheckCheck,
      className: "text-presence",
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
        <Icon size={14} strokeWidth={2.5} className={className} />
      </motion.span>
    </AnimatePresence>
  )
}
