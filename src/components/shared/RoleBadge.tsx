"use client"

import { Users, Briefcase, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/types"

const roleConfig: Record<UserRole, { label: string; icon: typeof Users; className: string }> = {
  PEER: {
    label: "Peer",
    icon: Users,
    className: "bg-text-low/10 text-text-medium",
  },
  BUSINESS: {
    label: "Business",
    icon: Briefcase,
    className: "bg-brand/15 text-brand",
  },
  FREELANCER: {
    label: "Freelancer",
    icon: Zap,
    className: "bg-presence/15 text-presence",
  },
}

interface RoleBadgeProps {
  role: UserRole
  className?: string
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = roleConfig[role]
  const Icon = config.icon

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className,
        className,
      )}
    >
      <Icon className="size-3" />
      {config.label}
    </span>
  )
}
