"use client"

import { ReactNode } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface CustomAccordionProps {
  children: ReactNode[]
  className?: string
  onValueChange?: (value: string | string[]) => void
}

interface AccordionItemProps {
  value: string
  children: ReactNode
  className?: string
  disabled?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function AccordionItem({
  value,
  children,
  className,
  disabled = false,
  open = false,
  onOpenChange,
}: AccordionItemProps) {
  return (
    <div className={cn("border border-border-subtle rounded-lg overflow-hidden", className)}>
      <button
        onClick={() => onOpenChange?.(!open)}
        className={cn(
          "w-full px-4 py-3 text-left font-medium transition-all duration-200",
          "hover:bg-bg-muted flex items-center justify-between gap-2",
          open && "bg-brand-subtle text-brand",
          disabled && "opacity-50 cursor-not-allowed",
        )}
        disabled={disabled}
      >
        <span>{value}</span>
        <ChevronDown
          className={cn("size-4 transition-transform duration-200", open && "transform rotate-180")}
        />
      </button>
      {open && <div className="p-4 border-t border-border-subtle bg-bg-surface/50">{children}</div>}
    </div>
  )
}

export function CustomAccordion({ children, className, onValueChange }: CustomAccordionProps) {
  const handleValueChange = (nextValue: string) => {
    onValueChange?.(nextValue)
  }

  return (
    <div className={cn("w-full space-y-2", className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            ...child.props,
            onOpenChange: handleValueChange,
          })
        }
        return child
      })}
    </div>
  )
}

export { AccordionItem }
