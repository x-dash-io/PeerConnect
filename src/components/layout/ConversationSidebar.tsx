"use client"

import { Search, SquarePen } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export function ConversationSidebar() {
  return (
    <aside className="hidden md:flex w-80 shrink-0 flex-col border-r border-border-subtle glass">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4">
        <h2 className="font-display text-lg font-semibold text-text-high">Messages</h2>
        <Button variant="ghost" size="icon" className="text-text-medium hover:text-text-high">
          <SquarePen className="size-5" />
        </Button>
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-text-low" />
          <Input
            placeholder="Search messages..."
            className="h-9 bg-bg-deep border-border-main pl-8 text-sm text-text-high placeholder:text-text-low focus-visible:border-brand focus-visible:ring-brand/25"
          />
        </div>
      </div>

      {/* Conversation list — skeleton placeholder */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-3">
            <Skeleton className="size-11 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-8" />
              </div>
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}
