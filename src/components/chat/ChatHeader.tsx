"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Phone, MoreHorizontal, Video, Info, Images } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AvatarWithPresence } from "@/components/shared/AvatarWithPresence"
import { RoleBadge } from "@/components/shared/RoleBadge"
import { MediaGallery } from "@/components/chat/MediaGallery"
import { UserProfile } from "@/types"
import { usePresence } from "@/hooks/usePresence"
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
  const recipient = participants.find((p) => p.id !== currentUserId)
  const { status: presence, lastSeen } = usePresence(recipient?.id)

  if (!recipient) return null

  const presenceText = (() => {
    if (presence === "online") return <span className="text-presence font-medium">Active now</span>
    if (presence === "away") return <span className="text-warn">Away</span>
    if (lastSeen) {
      return `Last seen ${formatDistanceToNow(new Date(lastSeen), { addSuffix: true })}`
    }
    return "Offline"
  })()

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border-subtle glass-heavy px-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex md:hidden items-center justify-center size-9 rounded-xl text-text-medium hover:text-text-high hover:bg-bg-muted transition-colors"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <AvatarWithPresence
            src={recipient.image || undefined}
            name={recipient.name || "User"}
            status={presence}
            size="md"
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-text-high leading-none">{recipient.name}</span>
              <RoleBadge role={recipient.role} />
            </div>
            <span className="text-[11px] text-text-medium mt-0.5">{presenceText}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex text-text-low hover:text-text-high hover:bg-bg-muted rounded-xl"
          >
            <Phone className="size-[18px]" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex text-text-low hover:text-text-high hover:bg-bg-muted rounded-xl"
          >
            <Video className="size-[18px]" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-text-low hover:text-text-high hover:bg-bg-muted rounded-xl"
                />
              }
            >
              <MoreHorizontal className="size-[18px]" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem className="gap-2">
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

      <MediaGallery
        conversationId={conversationId}
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
      />
    </>
  )
}
