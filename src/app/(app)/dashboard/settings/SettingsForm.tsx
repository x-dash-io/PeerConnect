"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  Users,
  Briefcase,
  Zap,
  CheckCircle,
  Camera,
  Loader2,
  AlertTriangle,
  Type,
  Palette,
  Image,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { UserAvatar } from "@/components/shared"
import { RoleBadge } from "@/components/shared/RoleBadge"
import { ThemeToggle } from "@/components/shared/ThemeToggle"
import { cn } from "@/lib/utils"
import type { UserRole, FontSize, BubbleTheme, ChatPreferences } from "@/types"
import { BUBBLE_THEMES } from "@/types"

interface SettingsUser {
  id: string
  name: string | null
  email: string
  image: string | null
  role: "PEER" | "BUSINESS" | "FREELANCER"
  bio: string | null
}

const fontSizes: { value: FontSize; label: string; description: string }[] = [
  { value: "small", label: "Small", description: "Compact view" },
  { value: "medium", label: "Medium", description: "Default size" },
  { value: "large", label: "Large", description: "Easier reading" },
]

const roles = [
  {
    value: "PEER" as UserRole,
    icon: Users,
    name: "Connect with Peers",
    description: "Collaborate and communicate with colleagues and partners",
  },
  {
    value: "BUSINESS" as UserRole,
    icon: Briefcase,
    name: "Business Owner",
    description: "Manage client relationships and team communication",
  },
  {
    value: "FREELANCER" as UserRole,
    icon: Zap,
    name: "Freelancer",
    description: "Professional tools for independent workers",
  },
]

export function SettingsForm({
  user,
  initialPreferences,
}: {
  user: SettingsUser
  initialPreferences: Record<string, unknown>
}) {
  const [name, setName] = useState(user.name ?? "")
  const [bio, setBio] = useState(user.bio ?? "")
  const [avatarUrl, setAvatarUrl] = useState(user.image ?? "")
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingAvatar, setSavingAvatar] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role)
  const [savingRole, setSavingRole] = useState(false)

  const [fontSize, setFontSize] = useState<FontSize>(
    (initialPreferences.fontSize as FontSize) ?? "medium",
  )
  const [bubbleTheme, setBubbleTheme] = useState<BubbleTheme>(
    (initialPreferences.bubbleTheme as BubbleTheme) ?? "indigo",
  )
  const [wallpaper, setWallpaper] = useState<string | null>(
    (initialPreferences.wallpaper as string) ?? null,
  )
  const [savingChatPrefs, setSavingChatPrefs] = useState(false)

  const profileDirty =
    name !== (user.name ?? "") || bio !== (user.bio ?? "") || avatarUrl !== (user.image ?? "")
  const roleDirty = selectedRole !== user.role

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setSavingAvatar(true)
    try {
      // Get signed URL
      const { url, key } = await fetch("/api/users/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type, sizeBytes: file.size }),
      }).then((r) => r.json())

      // Upload to S3
      const uploadRes = await fetch(url, { method: "PUT", body: file })
      if (!uploadRes.ok) throw new Error("Upload failed")

      const bucket = process.env.NEXT_PUBLIC_S3_BUCKET || "peerconnect-uploads"
      const imageUrl = `https://${bucket}.s3.amazonaws.com/${key}`
      setAvatarUrl(imageUrl)

      // Save to profile
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageUrl }),
      })
      if (!res.ok) throw new Error("Failed to save avatar")
      toast.success("Avatar updated")
    } catch {
      toast.error("Failed to upload avatar")
    } finally {
      setSavingAvatar(false)
    }
  }

  async function saveProfile() {
    if (!name.trim()) {
      toast.error("Display name is required")
      return
    }
    setSavingProfile(true)
    try {
      const updates: Record<string, unknown> = { name: name.trim() }
      if (bio.trim()) updates.bio = bio.trim()
      if (avatarUrl) updates.image = avatarUrl
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error("Failed to save")
      toast.success("Profile updated")
    } catch {
      toast.error("Failed to update profile")
    } finally {
      setSavingProfile(false)
    }
  }

  async function saveRole() {
    setSavingRole(true)
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole }),
      })
      if (!res.ok) throw new Error("Failed to save")
      toast.success("Role updated")
    } catch {
      toast.error("Failed to update role")
    } finally {
      setSavingRole(false)
    }
  }

  async function saveChatPrefs() {
    setSavingChatPrefs(true)
    try {
      const res = await fetch("/api/users/me/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fontSize, bubbleTheme, wallpaper }),
      })
      if (!res.ok) throw new Error("Failed to save")
      toast.success("Chat preferences updated")
    } catch {
      toast.error("Failed to update chat preferences")
    } finally {
      setSavingChatPrefs(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Appearance */}
      <section className="rounded-2xl border border-border-subtle bg-bg-surface p-6 surface-glow">
        <h2 className="font-display text-lg font-semibold text-text-high">Appearance</h2>
        <p className="mt-0.5 text-sm text-text-medium">Choose your preferred theme</p>
        <div className="mt-4">
          <ThemeToggle variant="pills" />
        </div>
      </section>

      {/* Profile */}
      <section className="rounded-2xl border border-border-subtle bg-bg-surface p-6 surface-glow">
        <h2 className="font-display text-lg font-semibold text-text-high">Profile</h2>
        <p className="mt-0.5 text-sm text-text-medium">Your public information</p>

        <div className="mt-6 flex items-center gap-4">
          <div className="relative">
            <UserAvatar
              name={user.name ?? "User"}
              src={(avatarUrl || user.image) ?? undefined}
              size="lg"
            />
            <label className="absolute -bottom-1 -right-1 flex size-7 cursor-pointer items-center justify-center rounded-full border-2 border-bg-surface bg-bg-muted text-text-medium transition-colors hover:bg-bg-elevated hover:text-text-high">
              {savingAvatar ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Camera className="size-3.5" />
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={savingAvatar}
              />
            </label>
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-text-high">{user.name ?? "User"}</p>
            <RoleBadge role={user.role} className="mt-1" />
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-text-high">
              Display Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your display name"
              className="h-10 bg-bg-deep border-border-main text-text-high placeholder:text-text-low focus-visible:border-brand focus-visible:ring-brand/25"
            />
          </div>
          <div>
            <label htmlFor="bio" className="mb-1.5 block text-sm font-medium text-text-high">
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others a bit about yourself..."
              rows={3}
              className="w-full rounded-xl border border-border-main bg-bg-deep px-3 py-2.5 text-sm text-text-high placeholder:text-text-low outline-none transition-colors focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/25 resize-none"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            onClick={saveProfile}
            disabled={!profileDirty || savingProfile}
            className="h-9 bg-brand px-5 text-white hover:bg-brand-hover active:scale-[0.98] transition-all disabled:opacity-40"
          >
            {savingProfile ? <Loader2 className="size-4 animate-spin" /> : "Save Changes"}
          </Button>
        </div>
      </section>

      {/* Role */}
      <section className="rounded-2xl border border-border-subtle bg-bg-surface p-6 surface-glow">
        <h2 className="font-display text-lg font-semibold text-text-high">Role</h2>
        <p className="mt-0.5 text-sm text-text-medium">How you use PeerConnect</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {roles.map((role) => {
            const selected = selectedRole === role.value
            return (
              <button
                key={role.value}
                type="button"
                onClick={() => setSelectedRole(role.value)}
                className={cn(
                  "relative flex flex-col items-center rounded-xl p-5 text-center transition-all duration-200 cursor-pointer",
                  selected
                    ? "border-2 border-brand bg-brand-subtle shadow-sm glow-brand-sm"
                    : "border border-border-main bg-bg-deep hover:bg-bg-muted hover:border-border-main",
                )}
              >
                {selected && (
                  <span className="absolute top-2 right-2 flex items-center justify-center rounded-full bg-brand p-0.5">
                    <CheckCircle className="size-4 text-white" />
                  </span>
                )}
                <role.icon className={`size-7 ${selected ? "text-brand" : "text-text-medium"}`} />
                <h3 className="mt-3 text-sm font-semibold text-text-high">{role.name}</h3>
                <p className="mt-1 text-xs text-text-medium leading-relaxed">{role.description}</p>
              </button>
            )
          })}
        </div>

        {roleDirty && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-warn/20 bg-warn/5 p-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" />
            <p className="text-sm text-warn">
              Changing your role updates your profile badge and available features
            </p>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <Button
            onClick={saveRole}
            disabled={!roleDirty || savingRole}
            className="h-9 bg-brand px-5 text-white hover:bg-brand-hover active:scale-[0.98] transition-all disabled:opacity-40"
          >
            {savingRole ? <Loader2 className="size-4 animate-spin" /> : "Confirm Role"}
          </Button>
        </div>
      </section>

      {/* Chat Settings */}
      <section className="rounded-2xl border border-border-subtle bg-bg-surface p-6 surface-glow">
        <h2 className="font-display text-lg font-semibold text-text-high">Chat</h2>
        <p className="mt-0.5 text-sm text-text-medium">Customize your messaging experience</p>

        {/* Font Size */}
        <div className="mt-6">
          <label className="flex items-center gap-2 text-sm font-medium text-text-high">
            <Type className="size-4 text-text-medium" />
            Font Size
          </label>
          <div className="mt-3 flex gap-2">
            {fontSizes.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFontSize(opt.value)}
                className={cn(
                  "flex-1 rounded-xl px-4 py-3 text-center transition-all duration-200 cursor-pointer",
                  fontSize === opt.value
                    ? "border-2 border-brand bg-brand-subtle shadow-sm"
                    : "border border-border-main bg-bg-deep hover:bg-bg-muted",
                )}
              >
                <span
                  className={cn(
                    "block font-semibold",
                    fontSize === opt.value ? "text-brand" : "text-text-high",
                  )}
                >
                  {opt.label}
                </span>
                <span className="mt-0.5 block text-xs text-text-medium">{opt.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Bubble Theme */}
        <div className="mt-6">
          <label className="flex items-center gap-2 text-sm font-medium text-text-high">
            <Palette className="size-4 text-text-medium" />
            Bubble Color
          </label>
          <div className="mt-3 grid grid-cols-6 gap-2">
            {(
              Object.entries(BUBBLE_THEMES) as [BubbleTheme, (typeof BUBBLE_THEMES)[BubbleTheme]][]
            ).map(([key, theme]) => (
              <button
                key={key}
                type="button"
                onClick={() => setBubbleTheme(key)}
                className={cn(
                  "relative flex aspect-square items-center justify-center rounded-xl transition-all duration-200 cursor-pointer",
                  bubbleTheme === key
                    ? "ring-2 ring-brand ring-offset-2 ring-offset-bg-surface scale-105"
                    : "hover:scale-105",
                )}
                title={theme.name}
              >
                <span
                  className={cn(
                    "flex h-full w-full items-center justify-center rounded-lg",
                    theme.outgoing.split(" ").slice(0, 2).join(" "),
                  )}
                >
                  <span className="text-[10px] font-bold text-white/90">A</span>
                </span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-text-medium">
            Selected:{" "}
            <span className="font-medium text-text-high">{BUBBLE_THEMES[bubbleTheme].name}</span>
          </p>
        </div>

        {/* Wallpaper */}
        <div className="mt-6">
          <label className="flex items-center gap-2 text-sm font-medium text-text-high">
            <Image className="size-4 text-text-medium" />
            Chat Wallpaper
          </label>
          <div className="mt-3 flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => {
                const url = prompt("Enter wallpaper image URL:")
                if (url) setWallpaper(url)
              }}
              className="border-border-main text-text-medium hover:text-text-high"
            >
              {wallpaper ? "Change Wallpaper" : "Set Wallpaper"}
            </Button>
            {wallpaper && (
              <Button
                variant="ghost"
                onClick={() => setWallpaper(null)}
                className="text-danger hover:text-danger hover:bg-danger/10"
              >
                Remove
              </Button>
            )}
          </div>
          {wallpaper && (
            <div className="mt-3 overflow-hidden rounded-xl border border-border-subtle">
              <div
                className="h-24 w-full rounded-lg bg-cover bg-center"
                style={{ backgroundImage: `url(${wallpaper})` }}
              />
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            onClick={saveChatPrefs}
            disabled={savingChatPrefs}
            className="h-9 bg-brand px-5 text-white hover:bg-brand-hover active:scale-[0.98] transition-all disabled:opacity-40"
          >
            {savingChatPrefs ? <Loader2 className="size-4 animate-spin" /> : "Save Chat Settings"}
          </Button>
        </div>
      </section>

      <Separator className="bg-border-subtle" />

      {/* Account */}
      <section className="rounded-2xl border border-border-subtle bg-bg-surface p-6 surface-glow">
        <h2 className="font-display text-lg font-semibold text-text-high">Account</h2>
        <p className="mt-0.5 text-sm text-text-medium">Manage your account credentials</p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-high">Email</label>
            <Input
              value={user.email}
              disabled
              className="h-10 bg-bg-deep border-border-main text-text-medium"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-high">Password</label>
            <Button
              variant="outline"
              onClick={() => toast.info("Password change coming soon")}
              className="border-border-main text-text-medium hover:text-text-high"
            >
              Change Password
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
