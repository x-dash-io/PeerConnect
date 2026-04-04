"use client"

import { useTheme } from "next-themes"
import { useSyncExternalStore } from "react"
import { Sun, Moon, Monitor } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

interface ThemeToggleProps {
  variant?: "icon" | "pills"
  className?: string
}

export function ThemeToggle({ variant = "icon", className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
  if (!mounted) return null

  if (variant === "pills") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1 rounded-xl border border-border-main bg-bg-deep p-1",
          className,
        )}
      >
        {[
          { value: "light", icon: Sun, label: "Light" },
          { value: "dark", icon: Moon, label: "Dark" },
          { value: "system", icon: Monitor, label: "System" },
        ].map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              theme === value
                ? "bg-brand-subtle text-brand shadow-sm"
                : "text-text-medium hover:text-text-high hover:bg-bg-muted",
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>
    )
  }

  // Cycle: dark → light → system → dark
  const nextTheme = theme === "dark" ? "light" : theme === "light" ? "system" : "dark"
  const CurrentIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor
  const label = theme === "dark" ? "Dark mode" : theme === "light" ? "Light mode" : "System"

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={() => setTheme(nextTheme)}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg text-text-low hover:text-text-medium hover:bg-bg-muted transition-colors",
              className,
            )}
          />
        }
      >
        <CurrentIcon className="size-5" />
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}
