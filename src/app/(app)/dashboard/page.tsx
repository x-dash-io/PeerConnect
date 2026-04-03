import { MessageSquare } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
      <div className="size-16 rounded-2xl bg-bg-muted flex items-center justify-center mb-6">
        <MessageSquare className="size-8 text-text-low" />
      </div>
      <h2 className="font-display text-xl font-semibold text-text-high mb-2">
        Select a conversation
      </h2>
      <p className="text-sm text-text-medium max-w-xs">
        Choose a conversation from the sidebar or start a new one to begin messaging.
      </p>
    </div>
  )
}
