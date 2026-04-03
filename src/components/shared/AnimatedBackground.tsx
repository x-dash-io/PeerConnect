"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface AnimatedBackgroundProps {
  className?: string
}

export function AnimatedBackground({ className }: AnimatedBackgroundProps) {
  return (
    <div className={cn("fixed inset-0 z-0 overflow-hidden pointer-events-none", className)}>
      {/* Animated gradient blobs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 100, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute -top-[10%] -left-[10%] h-[70%] w-[70%] rounded-full bg-brand/10 blur-[120px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          x: [0, -100, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute -bottom-[20%] -right-[10%] h-[80%] w-[80%] rounded-full bg-brand/5 blur-[140px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.5, 1],
          x: [0, 50, 0],
          y: [0, -100, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-[20%] right-[10%] h-[50%] w-[50%] rounded-full bg-presence/5 blur-[100px]"
      />

      {/* Noise overlay */}
      <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  )
}

export function GridOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
      style={{
        backgroundImage: "radial-gradient(circle, #ededed 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    />
  )
}
