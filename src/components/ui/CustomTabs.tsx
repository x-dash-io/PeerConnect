"use client"

import { useState, ReactNode } from "react"
import { cn } from "@/lib/utils"

interface CustomTab {
  value: string
  label: string
  icon?: ReactNode
  content: ReactNode
}

interface CustomTabsProps {
  tabs: CustomTab[]
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  className?: string
  tabClassName?: string
  contentClassName?: string
}

export function CustomTabs({
  tabs,
  defaultValue,
  value,
  onValueChange,
  className,
  tabClassName,
  contentClassName,
}: CustomTabsProps) {
  const [internalValue, setInternalValue] = useState<string>(defaultValue ?? tabs[0]?.value ?? "")

  const currentValue = value !== undefined ? value : internalValue
  const handleValueChange = (newValue: string) => {
    if (!onValueChange) {
      setInternalValue(newValue)
      return
    }
    onValueChange(newValue)
  }

  const currentTab = tabs.find((tab) => tab.value === currentValue) ?? tabs[0]

  return (
    <div className={cn("w-full", className)}>
      <div className={cn("flex border-b border-border-subtle", tabClassName)}>
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleValueChange(tab.value)}
            className={cn(
              "px-4 py-3 text-sm font-medium transition-all duration-200",
              "border-b-2 border-transparent",
              "hover:text-text-high hover:bg-bg-muted/50",
              currentValue === tab.value
                ? "text-brand border-brand bg-brand-subtle/30"
                : "text-text-medium",
            )}
          >
            <span className="flex items-center gap-2">
              {tab.icon && <span className="size-4">{tab.icon}</span>}
              {tab.label}
            </span>
          </button>
        ))}
      </div>
      <div className={cn("mt-4", contentClassName)}>{currentTab?.content}</div>
    </div>
  )
}
