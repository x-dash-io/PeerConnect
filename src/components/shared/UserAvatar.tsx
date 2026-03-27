"use client"

import Image from "next/image"
import { cn, getInitials } from "@/lib/utils"

const sizeMap = {
  sm: 32,
  md: 44,
  lg: 64,
} as const

const textSizeMap = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-lg",
} as const

interface UserAvatarProps {
  src?: string
  name: string
  size?: keyof typeof sizeMap
  className?: string
}

export function UserAvatar({ src, name, size = "md", className }: UserAvatarProps) {
  const px = sizeMap[size]

  return (
    <div
      className={cn("relative shrink-0 overflow-hidden rounded-full", className)}
      style={{ width: px, height: px }}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          width={px}
          height={px}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <div
          className={cn(
            "flex h-full w-full items-center justify-center rounded-full bg-brand-subtle font-medium text-brand",
            textSizeMap[size],
          )}
        >
          {getInitials(name)}
        </div>
      )}
    </div>
  )
}
