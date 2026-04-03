"use client"

import { isToday, isYesterday, format } from "date-fns"

interface DateSeparatorProps {
  date: string | Date
}

export function DateSeparator({ date }: DateSeparatorProps) {
  const d = typeof date === "string" ? new Date(date) : date

  const label = isToday(d) ? "Today" : isYesterday(d) ? "Yesterday" : format(d, "MMMM d, yyyy")

  return (
    <div className="flex items-center justify-center my-6 gap-4">
      <div className="h-px flex-1 bg-border-subtle" />
      <div className="bg-bg-muted px-2 py-0.5 rounded text-[10px] font-semibold text-text-medium/80 uppercase tracking-wider">
        {label}
      </div>
      <div className="h-px flex-1 bg-border-subtle" />
    </div>
  )
}
