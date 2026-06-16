"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { MessageSquare, Users, Zap, Settings, LogOut, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { AvatarWithPresence, Logo } from "@/components/shared"
import { ThemeToggle } from "@/components/shared/ThemeToggle"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { MessageSearch } from "@/components/chat/MessageSearch"

interface NavRailProps {
  userName: string
  userImage?: string | null
}

const navItems = [
  { href: "/dashboard", icon: MessageSquare, label: "Conversations" },
  { href: "/dashboard/contacts", icon: Users, label: "Contacts" },
  { href: "/dashboard/campaigns", icon: Zap, label: "Campaigns" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
]

export function NavRail({ userName, userImage }: NavRailProps) {
  const pathname = usePathname()
  const [searchOpen, setSearchOpen] = useState(false)

  // Cmd+K / Ctrl+K to open search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  return (
    <nav className="hidden md:flex w-[68px] shrink-0 flex-col items-center justify-between border-r border-border-subtle bg-bg-surface/60 backdrop-blur-xl py-5">
      {/* Logo */}
      <Logo imageSize={40} showText={false} />

      {/* Navigation */}
      <div className="flex flex-1 flex-col items-center gap-1.5 pt-8">
        {/* Search */}
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200",
                  searchOpen
                    ? "bg-brand-subtle text-brand shadow-sm glow-brand-sm"
                    : "text-text-low hover:text-text-medium hover:bg-bg-muted",
                )}
              />
            }
          >
            <Search className="size-[18px]" />
          </TooltipTrigger>
          <TooltipContent side="right">Search messages</TooltipContent>
        </Tooltip>

        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
          return (
            <Tooltip key={href}>
              <TooltipTrigger
                render={
                  <Link
                    href={href}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200",
                      active
                        ? "bg-brand-subtle text-brand shadow-sm glow-brand-sm"
                        : "text-text-low hover:text-text-medium hover:bg-bg-muted",
                    )}
                  />
                }
              >
                <Icon className="size-[18px]" />
              </TooltipTrigger>
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          )
        })}
      </div>

      <MessageSearch open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Bottom: Theme + Sign Out + Avatar */}
      <div className="flex flex-col items-center gap-2">
        <ThemeToggle />

        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                onClick={() => signOut({ redirectTo: "/login" })}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-text-low hover:text-danger hover:bg-danger/10 transition-all duration-200"
              />
            }
          >
            <LogOut className="size-[18px]" />
          </TooltipTrigger>
          <TooltipContent side="right">Sign out</TooltipContent>
        </Tooltip>

        <AvatarWithPresence
          name={userName}
          src={userImage ?? undefined}
          size="sm"
          status="online"
        />
      </div>
    </nav>
  )
}
