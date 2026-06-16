"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Phone, MoreHorizontal, Video, Info, Images } from "lucide-react"
import { cn, getInitials } from "@/lib/utils"
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

  const isOnline = presence === "online"

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-100 dark:border-neutral-800 px-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex md:hidden items-center justify-center size-9 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div className="relative shrink-0">
            <div className="flex size-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-sm font-medium text-indigo-700 dark:text-indigo-300">
              {getInitials(recipient.name || "U")}
            </div>
            <span
              className={cn(
                "absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white dark:border-neutral-900",
                isOnline ? "bg-emerald-400" : "bg-neutral-300 dark:bg-neutral-600",
              )}
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-medium text-neutral-900 dark:text-neutral-100 leading-none">
                {recipient.name}
              </span>
              <RoleBadge role={recipient.role} />
            </div>
            <span className="flex items-center gap-1 mt-0.5">
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  isOnline ? "bg-emerald-400" : "bg-neutral-300 dark:bg-neutral-600",
                )}
              />
              <span className="text-xs text-neutral-400">
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
          <button className="hidden md:flex items-center justify-center size-9 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all">
            <Phone className="size-[18px]" />
          </button>
          <button className="hidden md:flex items-center justify-center size-9 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all">
            <Video className="size-[18px]" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="flex items-center justify-center size-9 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all" />
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
