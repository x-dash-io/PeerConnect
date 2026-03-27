"use client"

import { motion } from "framer-motion"

const dotDelays = [0, 0.15, 0.3]

export function TypingIndicator() {
  return (
    <div className="inline-flex items-center gap-1 rounded-tl-[4px] rounded-tr-[18px] rounded-br-[18px] rounded-bl-[18px] border border-border-main bg-bg-surface px-3 py-2">
      {dotDelays.map((delay, i) => (
        <motion.span
          key={i}
          className="block h-1.5 w-1.5 rounded-full bg-bg-muted"
          animate={{ y: [0, -4, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            repeatDelay: 0.2,
            delay,
            ease: "easeInOut",
          }}
        />
      ))}
      <span className="sr-only">Typing</span>
    </div>
  )
}
