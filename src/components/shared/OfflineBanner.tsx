"use client"

import { WifiOff } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { useNetworkStatus } from "@/hooks/useNetworkStatus"

export function OfflineBanner() {
  const online = useNetworkStatus()

  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed inset-x-0 top-0 z-50 flex h-10 items-center justify-center gap-2 bg-destructive text-white text-sm font-medium shadow-lg"
        >
          <WifiOff className="size-4" />
          <span>You are offline. Messages will send when reconnected.</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
