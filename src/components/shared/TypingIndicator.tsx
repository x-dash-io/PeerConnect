"use client"

import { motion } from "framer-motion"

const dotDelays = [0, 0.15, 0.3]

export function TypingIndicator() {
  return (
    <div className="inline-flex items-center gap-1 rounded-2xl rounded-tl-sm border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5">
      {dotDelays.map((delay, i) => (
        <motion.span
          key={i}
          className="block h-1.5 w-1.5 rounded-full bg-neutral-400"
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
