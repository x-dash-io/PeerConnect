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
      <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
      <div className="bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
        {label}
      </div>
      <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
    </div>
  )
}
