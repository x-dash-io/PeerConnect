"use client"

import { Check, CheckCheck, Loader2 } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

type MessageStatus = "sending" | "sent" | "delivered" | "read"

interface MessageStatusIconProps {
  status: MessageStatus
}

const iconConfig = {
  sending: { Icon: Loader2, className: "animate-spin text-text-low" },
  sent: { Icon: Check, className: "text-text-medium" },
  delivered: { Icon: CheckCheck, className: "text-text-medium" },
  read: { Icon: CheckCheck, className: "text-brand" },
} as const

export function MessageStatusIcon({ status }: MessageStatusIconProps) {
  const { Icon, className } = iconConfig[status]

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={status}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="inline-flex items-center"
      >
        <Icon size={12} className={className} />
      </motion.span>
    </AnimatePresence>
  )
}
