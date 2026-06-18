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
      <div className="h-px flex-1 bg-border-main/50" />
      <div className="bg-bg-elevated/80 px-3 py-1 rounded-full text-[10px] font-semibold text-text-medium uppercase tracking-wider">
        {label}
      </div>
      <div className="h-px flex-1 bg-border-main/50" />
    </div>
  )
}
