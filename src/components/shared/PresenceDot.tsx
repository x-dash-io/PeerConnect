import { cn } from "@/lib/utils"

const statusColors = {
  online: "bg-presence",
  away: "bg-warn",
  offline: "bg-text-low",
} as const

interface PresenceDotProps {
  status: "online" | "away" | "offline"
  className?: string
}

export function PresenceDot({ status, className }: PresenceDotProps) {
  return (
    <span
      className={cn(
        "absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full border-2 border-bg-surface",
        statusColors[status],
        status === "online" && "shadow-[0_0_6px_var(--presence)]",
        className,
      )}
      aria-label={status}
    />
  )
}
