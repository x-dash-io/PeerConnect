"use client"

import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ConversationList } from "@/components/chat/ConversationList"

export function ConversationSidebar() {
  const pathname = usePathname()
  const hasActiveConversation = /^\/dashboard\/(?!settings|contacts|campaigns)/.test(pathname)
  // Hide sidebar on mobile for full-page routes (settings, contacts, campaigns)
  const isFullPageRoute = /^\/(dashboard\/(settings|contacts|campaigns))/.test(pathname)

  return (
    <aside
      className={cn(
        "shrink-0 flex-col border-r border-border-subtle glass-heavy h-full",
        hasActiveConversation
          ? "hidden md:flex md:w-80"
          : isFullPageRoute
            ? "hidden md:flex md:w-80"
            : "flex w-full md:w-80",
      )}
    >
      <ConversationList />
    </aside>
  )
}
