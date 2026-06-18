"use client"

import { SettingsSidebar } from "@/components/settings/SettingsSidebar"

interface SettingsLayoutProps {
  children: React.ReactNode
}

export function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="flex flex-1 min-h-0">
      <SettingsSidebar />
      <div className="flex-1 overflow-y-auto p-6 md:p-10">{children}</div>
    </div>
  )
}
