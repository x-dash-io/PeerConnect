import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { QueryProvider } from "@/providers/QueryProvider"
import { SocketProvider } from "@/providers/SocketProvider"
import { NavRail } from "@/components/layout/NavRail"
import { ConversationSidebar } from "@/components/layout/ConversationSidebar"
import { MobileNav } from "@/components/layout/MobileNav"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  return (
    <QueryProvider>
      <SocketProvider userId={session.user.id}>
        <div className="flex h-screen overflow-hidden bg-bg-deep">
          {/* Desktop: icon nav rail + sidebar */}
          <NavRail userName={session.user.name ?? "User"} userImage={session.user.image} />
          <ConversationSidebar />

          {/* Main content */}
          <main className="flex flex-1 flex-col overflow-y-auto pb-16 md:pb-0">{children}</main>

          {/* Mobile bottom nav */}
          <MobileNav />
        </div>
      </SocketProvider>
    </QueryProvider>
  )
}
