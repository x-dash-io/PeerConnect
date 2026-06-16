"use client"

import { useState } from "react"
import {
  Zap,
  Plus,
  Send,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Users,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { CreateCampaignModal } from "@/components/campaigns/CreateCampaignModal"

interface Campaign {
  id: string
  senderId: string
  content: string
  recipientCount: number
  deliveredCount: number
  status: "DRAFT" | "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED"
  createdAt: Date
}

const statusConfig = {
  DRAFT: {
    label: "Draft",
    icon: FileText,
    className: "bg-bg-muted text-text-medium border-border-main",
  },
  PENDING: {
    label: "Pending",
    icon: Clock,
    className: "bg-warn/10 text-warn border-warn/20",
  },
  IN_PROGRESS: {
    label: "Sending",
    icon: Send,
    className: "bg-brand-subtle text-brand border-brand/20",
  },
  COMPLETED: {
    label: "Completed",
    icon: CheckCircle2,
    className: "bg-presence/10 text-presence border-presence/20",
  },
  FAILED: {
    label: "Failed",
    icon: AlertTriangle,
    className: "bg-danger/10 text-danger border-danger/20",
  },
}

function CampaignCard({ campaign }: { campaign: Campaign }) {
  const config = statusConfig[campaign.status]
  const StatusIcon = config.icon
  const deliveryRate =
    campaign.recipientCount > 0
      ? Math.round((campaign.deliveredCount / campaign.recipientCount) * 100)
      : 0

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface p-5 transition-all hover:border-border-main surface-glow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text-high line-clamp-2 leading-relaxed">{campaign.content}</p>
          <div className="mt-3 flex items-center gap-4 text-xs text-text-medium">
            <span className="flex items-center gap-1.5">
              <Users className="size-3.5" />
              {campaign.recipientCount} recipients
            </span>
            {campaign.deliveredCount > 0 && (
              <span className="flex items-center gap-1.5">
                <TrendingUp className="size-3.5" />
                {deliveryRate}% delivered
              </span>
            )}
            <span>{format(new Date(campaign.createdAt), "MMM d, yyyy")}</span>
          </div>
        </div>
        <Badge variant="outline" className={`shrink-0 gap-1.5 ${config.className}`}>
          <StatusIcon className="size-3" />
          {config.label}
        </Badge>
      </div>

      {campaign.status === "IN_PROGRESS" && campaign.recipientCount > 0 && (
        <div className="mt-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-muted">
            <div
              className="h-full rounded-full bg-brand transition-all duration-500"
              style={{ width: `${deliveryRate}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export function CampaignsDashboard({ initialCampaigns }: { initialCampaigns: Campaign[] }) {
  const [filter, setFilter] = useState<Campaign["status"] | "ALL">("ALL")
  const [modalOpen, setModalOpen] = useState(false)

  const filtered =
    filter === "ALL" ? initialCampaigns : initialCampaigns.filter((c) => c.status === filter)

  const stats = {
    total: initialCampaigns.length,
    active: initialCampaigns.filter((c) => c.status === "IN_PROGRESS" || c.status === "PENDING")
      .length,
    completed: initialCampaigns.filter((c) => c.status === "COMPLETED").length,
    totalDelivered: initialCampaigns.reduce((sum, c) => sum + c.deliveredCount, 0),
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6 md:p-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-high">Campaigns</h1>
          <p className="mt-1 text-sm text-text-medium">Send bulk messages to multiple recipients</p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="gap-2 bg-brand text-white hover:bg-brand-hover"
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">New Campaign</span>
        </Button>
      </div>

      <CreateCampaignModal open={modalOpen} onClose={() => setModalOpen(false)} />

      {/* Stats */}
      {initialCampaigns.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total", value: stats.total, icon: Zap },
            { label: "Active", value: stats.active, icon: Send },
            { label: "Completed", value: stats.completed, icon: CheckCircle2 },
            { label: "Delivered", value: stats.totalDelivered, icon: TrendingUp },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border-subtle bg-bg-surface p-4 surface-glow"
            >
              <div className="flex items-center gap-2 text-text-low mb-1">
                <stat.icon className="size-3.5" />
                <span className="text-xs font-medium">{stat.label}</span>
              </div>
              <p className="text-xl font-bold text-text-high">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      {initialCampaigns.length > 0 && (
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {(["ALL", "DRAFT", "PENDING", "IN_PROGRESS", "COMPLETED", "FAILED"] as const).map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === status
                    ? "bg-brand-subtle text-brand"
                    : "text-text-medium hover:text-text-high hover:bg-bg-muted"
                }`}
              >
                {status === "ALL"
                  ? "All"
                  : status === "IN_PROGRESS"
                    ? "Sending"
                    : status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ),
          )}
        </div>
      )}

      {/* Campaign list */}
      {initialCampaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="size-16 rounded-2xl bg-bg-muted flex items-center justify-center mb-6">
            <Zap className="size-8 text-text-low" />
          </div>
          <h2 className="font-display text-lg font-semibold text-text-high mb-2">
            No campaigns yet
          </h2>
          <p className="text-sm text-text-medium max-w-sm mb-6">
            Create a campaign to send messages to multiple recipients at once. Great for
            announcements and outreach.
          </p>
          <Button
            onClick={() => setModalOpen(true)}
            className="gap-2 bg-brand text-white hover:bg-brand-hover"
          >
            <Plus className="size-4" />
            Create Your First Campaign
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-text-medium">No campaigns with this status</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  )
}
