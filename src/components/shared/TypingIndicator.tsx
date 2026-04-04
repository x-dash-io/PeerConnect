"use client"

import { motion } from "framer-motion"

const dotDelays = [0, 0.15, 0.3]

export function TypingIndicator() {
  return (
    <div className="inline-flex items-center gap-1 rounded-2xl rounded-tl-lg border border-border-subtle bg-bg-surface px-3.5 py-2.5 surface-glow">
      {dotDelays.map((delay, i) => (
        <motion.span
          key={i}
          className="block h-1.5 w-1.5 rounded-full bg-text-low"
          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
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
