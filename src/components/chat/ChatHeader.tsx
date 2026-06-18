"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Phone, MoreHorizontal, Video, Info, Images } from "lucide-react"
import { cn, getInitials } from "@/lib/utils"
import { RoleBadge } from "@/components/shared/RoleBadge"
import { MediaGallery } from "@/components/chat/MediaGallery"
import { UserProfile } from "@/types"
import { usePresence } from "@/hooks/usePresence"
import { ProfileDialog } from "@/components/shared/ProfileDialog"
import { formatDistanceToNow } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ChatHeaderProps {
  conversationId: string
  participants: UserProfile[]
  currentUserId: string
}

export function ChatHeader({ conversationId, participants, currentUserId }: ChatHeaderProps) {
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const recipient = participants.find((p) => p.id !== currentUserId)
  const { status: presence, lastSeen } = usePresence(recipient?.id)

  if (!recipient) return null

  const isOnline = presence === "online"

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border-subtle bg-bg-surface/80 dark:bg-bg-deep/80 backdrop-blur-xl px-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex md:hidden items-center justify-center size-9 rounded-lg text-text-low hover:text-text-high hover:bg-bg-muted transition-colors"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div className="relative shrink-0">
            <div className="flex size-10 items-center justify-center rounded-full bg-brand-subtle text-sm font-medium text-brand">
              {getInitials(recipient.name || "U")}
            </div>
            <span
              className={cn(
                "absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-bg-surface dark:border-bg-deep",
                isOnline ? "bg-presence" : "bg-text-low",
              )}
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-medium text-text-high leading-none">{recipient.name}</span>
              <RoleBadge role={recipient.role} />
            </div>
            <span className="flex items-center gap-1 mt-0.5">
              <span
                className={cn("size-1.5 rounded-full", isOnline ? "bg-presence" : "bg-text-low")}
              />
              <span className="text-xs text-text-medium">
                {isOnline
                  ? "Online"
                  : presence === "away"
                    ? "Away"
                    : lastSeen
                      ? `Last seen ${formatDistanceToNow(new Date(lastSeen), { addSuffix: true })}`
                      : "Offline"}
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button className="hidden md:flex items-center justify-center size-9 rounded-lg text-text-low hover:text-text-high hover:bg-bg-muted transition-all">
            <Phone className="size-[18px]" />
          </button>
          <button className="hidden md:flex items-center justify-center size-9 rounded-lg text-text-low hover:text-text-high hover:bg-bg-muted transition-all">
            <Video className="size-[18px]" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="flex items-center justify-center size-9 rounded-lg text-text-low hover:text-text-high hover:bg-bg-muted transition-all" />
              }
            >
              <MoreHorizontal className="size-[18px]" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem className="gap-2" onClick={() => setProfileOpen(true)}>
                <Info className="size-4" /> View profile
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2" onClick={() => setGalleryOpen(true)}>
                <Images className="size-4" /> View shared files
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 text-destructive focus:bg-destructive/10">
                Block user
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <ProfileDialog
        user={recipient}
        presence={presence}
        open={profileOpen}
        onOpenChange={setProfileOpen}
      />

      <MediaGallery
        conversationId={conversationId}
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
      />
    </>
  )
}
