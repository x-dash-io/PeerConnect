"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Users, Briefcase, Zap, CheckCircle, Camera, Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { UserAvatar } from "@/components/shared"
import { RoleBadge } from "@/components/shared/RoleBadge"
import type { UserRole } from "@/types"

interface SettingsUser {
  id: string
  name: string | null
  email: string
  image: string | null
  role: "PEER" | "BUSINESS" | "FREELANCER"
  bio: string | null
}

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

export function SettingsForm({ user }: { user: SettingsUser }) {
  // Profile state
  const [name, setName] = useState(user.name ?? "")
  const [bio, setBio] = useState(user.bio ?? "")
  const [savingProfile, setSavingProfile] = useState(false)

  // Role state
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role)
  const [savingRole, setSavingRole] = useState(false)

  const profileDirty = name !== (user.name ?? "") || bio !== (user.bio ?? "")
  const roleDirty = selectedRole !== user.role

  async function saveProfile() {
    if (!name.trim()) {
      toast.error("Display name is required")
      return
    }
    setSavingProfile(true)
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), bio: bio.trim() || null }),
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

  return (
    <div className="space-y-8">
      {/* ── Profile Section ── */}
      <section className="rounded-xl border border-border-main bg-bg-surface p-6">
        <h2 className="font-display text-lg font-semibold text-text-high">Profile</h2>
        <p className="mt-0.5 text-sm text-text-medium">Your public information</p>

        <div className="mt-6 flex items-center gap-4">
          <div className="relative">
            <UserAvatar name={user.name ?? "User"} src={user.image ?? undefined} size="lg" />
            <button
              type="button"
              className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border-2 border-bg-surface bg-bg-muted text-text-medium transition-colors hover:bg-bg-elevated hover:text-text-high"
              onClick={() => toast.info("Avatar upload coming in Phase 4")}
            >
              <Camera className="size-3.5" />
            </button>
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
              className="h-9 bg-bg-deep border-border-main text-text-high placeholder:text-text-low focus-visible:border-brand focus-visible:ring-brand/25"
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
              className="w-full rounded-lg border border-border-main bg-bg-deep px-2.5 py-2 text-sm text-text-high placeholder:text-text-low outline-none transition-colors focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/25 resize-none"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            onClick={saveProfile}
            disabled={!profileDirty || savingProfile}
            className="h-9 bg-brand px-4 text-white hover:bg-brand-hover active:scale-[0.98] transition-all disabled:opacity-40"
          >
            {savingProfile ? <Loader2 className="size-4 animate-spin" /> : "Save Changes"}
          </Button>
        </div>
      </section>

      {/* ── Role Section ── */}
      <section className="rounded-xl border border-border-main bg-bg-surface p-6">
        <h2 className="font-display text-lg font-semibold text-text-high">Role</h2>
        <p className="mt-0.5 text-sm text-text-medium">How you use PeerConnect</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {roles.map((role) => {
            const selected = selectedRole === role.value
            return (
              <button
                key={role.value}
                type="button"
                onClick={() => setSelectedRole(role.value)}
                className={`relative flex flex-col items-center rounded-xl p-6 text-center transition-all duration-150 cursor-pointer ${
                  selected
                    ? "border-2 border-brand bg-brand-subtle"
                    : "border border-border-main bg-bg-deep hover:bg-bg-muted"
                }`}
              >
                {selected && (
                  <span className="absolute top-2 right-2 flex items-center justify-center rounded-full bg-brand p-0.5">
                    <CheckCircle className="size-4 text-white" />
                  </span>
                )}
                <role.icon className={`size-8 ${selected ? "text-brand" : "text-text-medium"}`} />
                <h3 className="mt-3 text-sm font-semibold text-text-high">{role.name}</h3>
                <p className="mt-1 text-xs text-text-medium leading-relaxed">{role.description}</p>
              </button>
            )
          })}
        </div>

        {roleDirty && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-warn/20 bg-warn/5 p-3">
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
            className="h-9 bg-brand px-4 text-white hover:bg-brand-hover active:scale-[0.98] transition-all disabled:opacity-40"
          >
            {savingRole ? <Loader2 className="size-4 animate-spin" /> : "Confirm Role"}
          </Button>
        </div>
      </section>

      <Separator className="bg-border-subtle" />

      {/* ── Account Section ── */}
      <section className="rounded-xl border border-border-main bg-bg-surface p-6">
        <h2 className="font-display text-lg font-semibold text-text-high">Account</h2>
        <p className="mt-0.5 text-sm text-text-medium">Manage your account credentials</p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-high">Email</label>
            <Input
              value={user.email}
              disabled
              className="h-9 bg-bg-deep border-border-main text-text-medium"
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
