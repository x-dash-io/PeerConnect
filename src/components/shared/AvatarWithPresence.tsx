"use client"

import { cn } from "@/lib/utils"
import { UserAvatar } from "./UserAvatar"
import { PresenceDot } from "./PresenceDot"

interface AvatarWithPresenceProps {
  src?: string
  name: string
  size?: "sm" | "md" | "lg"
  status: "online" | "away" | "offline"
  className?: string
}

export function AvatarWithPresence({
  src,
  name,
  size = "md",
  status,
  className,
}: AvatarWithPresenceProps) {
  return (
    <div className={cn("relative inline-block", className)}>
      <UserAvatar src={src} name={name} size={size} />
      <PresenceDot status={status} />
    </div>
  )
}
