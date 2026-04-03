"use client"

import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hasActiveConversation = /^\/dashboard\/(?!settings)/.test(pathname)

  return (
    <main
      className={cn(
        "flex flex-1 flex-col overflow-y-auto md:pb-0",
        hasActiveConversation ? "pb-0" : "hidden pb-16 md:flex",
      )}
    >
      {children}
    </main>
  )
}
