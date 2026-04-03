"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { MessageSquare, Users, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", icon: MessageSquare, label: "Chats" },
  { href: "/dashboard/contacts", icon: Users, label: "Contacts" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
]

export function MobileNav() {
  const pathname = usePathname()
  const hasActiveConversation = /^\/dashboard\/(?!settings|contacts)/.test(pathname)

  // Hide bottom nav when inside a conversation (chat has its own header)
  if (hasActiveConversation) return null

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-border-subtle glass md:hidden">
      {navItems.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] transition-colors",
              active ? "text-brand" : "text-text-low",
            )}
          >
            <Icon className="size-5" />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
