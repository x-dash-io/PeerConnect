"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { MessageSquare, Users, Zap, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", icon: MessageSquare, label: "Chats" },
  { href: "/dashboard/contacts", icon: Users, label: "Contacts" },
  { href: "/dashboard/campaigns", icon: Zap, label: "Campaigns" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
]

export function MobileNav() {
  const pathname = usePathname()
  // Hide when inside a conversation chat view (not settings/contacts/campaigns)
  const inConversation = /^\/dashboard\/(?!settings|contacts|campaigns)[^/]+/.test(pathname)

  if (inConversation) return null

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around glass-heavy md:hidden">
      {navItems.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium transition-colors",
              active ? "text-brand" : "text-text-low hover:text-text-medium",
            )}
          >
            <Icon className={cn("size-5", active && "drop-shadow-[0_0_6px_var(--brand-glow)]")} />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
