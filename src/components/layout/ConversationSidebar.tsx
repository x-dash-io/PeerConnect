"use client"

import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ConversationList } from "@/components/chat/ConversationList"

export function ConversationSidebar() {
  const pathname = usePathname()
  const hasActiveConversation = /^\/dashboard\/(?!settings)/.test(pathname)

  return (
    <aside
      className={cn(
        "shrink-0 flex-col border-r border-border-subtle glass",
        hasActiveConversation ? "hidden md:flex md:w-80" : "flex w-full md:w-80",
      )}
    >
      <ConversationList />
    </aside>
  )
}
