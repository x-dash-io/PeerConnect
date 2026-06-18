"use client"

import { useState, ReactNode } from "react"
import { cn } from "@/lib/utils"

interface CustomDropdownProps {
  trigger: ReactNode
  items: Array<{ label: string; onClick: () => void; icon?: ReactNode; className?: string }>
  className?: string
  triggerClassName?: string
  contentClassName?: string
}

export function CustomDropdown({
  trigger,
  items,
  className,
  triggerClassName,
  contentClassName,
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleOpen = () => {
    setIsOpen(true)
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  const handleItemClick = (onClick: () => void) => {
    onClick()
    setIsOpen(false)
  }

  return (
    <div className={cn("relative inline-block", className)}>
      <div
        className={cn("inline-block", triggerClassName)}
        onClick={handleOpen}
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
      >
        {trigger}
      </div>
      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-1 w-48 rounded-xl border shadow-lg",
            "bg-bg-surface/95 border-border-subtle backdrop-blur-sm",
            "py-1",
            contentClassName,
          )}
          onMouseEnter={handleOpen}
          onMouseLeave={handleClose}
        >
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => handleItemClick(item.onClick)}
              className={cn(
                "w-full px-3 py-2 text-left text-sm transition-all duration-200",
                "hover:bg-bg-muted hover:text-text-high",
                "flex items-center gap-2",
                item.className,
              )}
            >
              {item.icon && <span className="size-4">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
