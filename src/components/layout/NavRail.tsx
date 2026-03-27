"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { MessageSquare, Users, Zap, Settings, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { AvatarWithPresence } from "@/components/shared"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

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

  return (
    <nav className="hidden md:flex w-16 shrink-0 flex-col items-center justify-between border-r border-border-subtle glass py-4">
      {/* Logo */}
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand font-display text-lg font-bold text-white">
        P
      </div>

      {/* Navigation */}
      <div className="flex flex-1 flex-col items-center gap-1 pt-8">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
          return (
            <Tooltip key={href}>
              <TooltipTrigger
                render={
                  <Link
                    href={href}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                      active
                        ? "bg-brand-subtle text-brand"
                        : "text-text-low hover:text-text-medium hover:bg-bg-muted",
                    )}
                  />
                }
              >
                <Icon className="size-5" />
              </TooltipTrigger>
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          )
        })}
      </div>

      {/* Bottom: User + Sign Out */}
      <div className="flex flex-col items-center gap-3">
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                onClick={() => signOut({ redirectTo: "/login" })}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-text-low hover:text-danger hover:bg-danger/10 transition-colors"
              />
            }
          >
            <LogOut className="size-5" />
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
