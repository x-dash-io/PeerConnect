import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export default function DashboardPage() {
  return (
    <div className="p-8 space-y-8 bg-zinc-950 min-h-screen text-zinc-100">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-6">
        <h1 className="text-3xl font-bold italic tracking-tight">PeerConnect</h1>
        <div className="flex items-center space-x-4">
          <Badge
            variant="outline"
            className="border-emerald-500/20 text-emerald-400 bg-emerald-500/5 px-2 py-1"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2" />
            Online
          </Badge>
          <Avatar className="h-10 w-10 border border-zinc-800 ring-2 ring-indigo-500/10 ring-offset-2 ring-offset-zinc-950">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 shadow-sm transition-all hover:bg-zinc-900/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
              Unread Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-zinc-500 mt-1">+2 from last hour</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 shadow-sm transition-all hover:bg-zinc-900/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
              Active Peers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-zinc-500 mt-1">Currently online</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-6 flex items-center space-x-2">
          <span>Recent Conversations</span>
          <div className="h-px bg-zinc-800 flex-1 ml-4" />
        </h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 transition-colors cursor-pointer group"
            >
              <Avatar className="mr-4 ring-2 ring-transparent group-hover:ring-indigo-500/20 transition-all">
                <AvatarFallback>P{i}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium group-hover:text-indigo-400 transition-colors">
                    Professional Peer {i}
                  </h3>
                  <span className="text-xs text-zinc-500">2m ago</span>
                </div>
                <p className="text-sm text-zinc-400 line-clamp-1">
                  Attached the latest project specifications for your review...
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
