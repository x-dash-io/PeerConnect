"use client"

import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hasActiveConversation = /^\/dashboard\/(?!settings|contacts|campaigns)/.test(pathname)
  // Full-page routes that should show main content and hide sidebar on mobile
  const isFullPageRoute = /^\/(dashboard\/(settings|contacts|campaigns))/.test(pathname)

  return (
    <main
      className={cn(
        "flex flex-1 flex-col overflow-y-auto md:pb-0",
        hasActiveConversation ? "pb-0" : isFullPageRoute ? "pb-16" : "hidden pb-16 md:flex",
      )}
    >
      {children}
    </main>
  )
}
