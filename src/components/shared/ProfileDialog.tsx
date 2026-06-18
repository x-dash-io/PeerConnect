"use client"

import { Mail, Calendar } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { RoleBadge } from "@/components/shared/RoleBadge"
import { PresenceDot } from "@/components/shared/PresenceDot"
import { UserProfile, PresenceStatus } from "@/types"

interface ProfileDialogProps {
  user: UserProfile
  presence?: PresenceStatus
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileDialog({ user, presence, open, onOpenChange }: ProfileDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-sm">
        <DialogTitle className="sr-only">{user.name}&apos;s Profile</DialogTitle>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="relative">
            <UserAvatar src={user.image ?? undefined} name={user.name ?? "U"} size="lg" />
            {presence && <PresenceDot status={presence} />}
          </div>

          <div className="flex flex-col items-center gap-1 text-center">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-text-high">{user.name ?? "Unnamed"}</span>
              <RoleBadge role={user.role} />
            </div>
            {presence && (
              <span className="text-xs text-text-medium capitalize">
                {presence === "online" ? "Online" : presence === "away" ? "Away" : "Offline"}
              </span>
            )}
          </div>

          {user.bio && (
            <p className="text-sm text-text-medium text-center max-w-xs leading-relaxed">
              {user.bio}
            </p>
          )}

          <div className="flex flex-col gap-2 w-full pt-2 border-t border-border-subtle">
            <div className="flex items-center gap-3 text-sm text-text-low">
              <Mail className="size-4 shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-text-low">
              <Calendar className="size-4 shrink-0" />
              <span>Member</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
