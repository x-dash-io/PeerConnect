import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { QueryProvider } from "@/providers/QueryProvider"
import { SocketProvider } from "@/providers/SocketProvider"
import { SessionProvider } from "@/providers/SessionProvider"
import { ChatPreferencesProvider } from "@/providers/ChatPreferencesProvider"
import { NavRail } from "@/components/layout/NavRail"
import { ConversationSidebar } from "@/components/layout/ConversationSidebar"
import { MainContent } from "@/components/layout/MainContent"
import { MobileNav } from "@/components/layout/MobileNav"
import { OfflineBanner } from "@/components/shared/OfflineBanner"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  return (
    <SessionProvider>
      <QueryProvider>
        <SocketProvider userId={session.user.id}>
          <ChatPreferencesProvider>
            <OfflineBanner />
            <div className="flex h-screen overflow-hidden bg-bg-deep">
              {/* Desktop: icon nav rail + sidebar */}
              <NavRail userName={session.user.name ?? "User"} userImage={session.user.image} />
              <ConversationSidebar />

              {/* Main content */}
              <MainContent>{children}</MainContent>

              {/* Mobile bottom nav */}
              <MobileNav />
            </div>
          </ChatPreferencesProvider>
        </SocketProvider>
      </QueryProvider>
    </SessionProvider>
  )
}
