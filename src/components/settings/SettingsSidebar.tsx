"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Palette, User, Briefcase, MessageSquare, Settings, AlertTriangle } from "lucide-react"

const sections = [
  { href: "/dashboard/settings", label: "Appearance", icon: Palette },
  { href: "/dashboard/settings?tab=profile", label: "Profile", icon: User },
  { href: "/dashboard/settings?tab=role", label: "Role", icon: Briefcase },
  { href: "/dashboard/settings?tab=chat", label: "Chat", icon: MessageSquare },
  { href: "/dashboard/settings?tab=account", label: "Account", icon: Settings },
] as const

type Section = (typeof sections)[number]

export function SettingsSidebar() {
  const pathname = usePathname()
  const searchParams = new URLSearchParams(window.location.search)
  const activeTab = searchParams.get("tab") || "appearance"

  const getActiveHref = (section: Section) => {
    if (section.href.includes("?")) {
      return section.href
    }
    return section.href
  }

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border-subtle bg-bg-surface/60 backdrop-blur-xl">
      <div className="p-6 border-b border-border-subtle">
        <h2 className="font-display text-lg font-semibold text-text-high">Settings</h2>
        <p className="mt-1 text-sm text-text-medium">Manage your preferences</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {sections.map((section) => {
          const isActive = (() => {
            if (section.href.includes("tab=")) {
              const tab = section.href.split("tab=")[1]
              return activeTab === tab
            }
            return activeTab === "appearance" && pathname === "/dashboard/settings"
          })()

          return (
            <Link
              key={section.label}
              href={getActiveHref(section)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-brand-subtle text-brand shadow-sm"
                  : "text-text-medium hover:text-text-high hover:bg-bg-muted",
              )}
            >
              <section.icon className="size-5 shrink-0" aria-hidden="true" />
              {section.label}
            </Link>
          )
        })}

        <div className="mt-6 pt-4 border-t border-border-subtle">
          <p className="px-3 text-xs font-medium text-text-low uppercase tracking-wider">
            Danger Zone
          </p>
          <button
            className={cn(
              "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              "text-danger hover:bg-danger/10 hover:text-danger",
            )}
          >
            <AlertTriangle className="size-5 shrink-0" aria-hidden="true" />
            Delete Account
          </button>
        </div>
      </nav>

      <div className="p-4 border-t border-border-subtle">
        <p className="text-xs text-text-low text-center">PeerConnect v1.0.0</p>
      </div>
    </aside>
  )
}
