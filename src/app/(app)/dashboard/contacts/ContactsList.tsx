"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, UserPlus, MessageSquare, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AvatarWithPresence } from "@/components/shared/AvatarWithPresence"
import { RoleBadge } from "@/components/shared/RoleBadge"
import { NewConversationButton } from "@/components/chat/NewConversationButton"
import { usePresence } from "@/hooks/usePresence"
import { useCreateConversation } from "@/hooks/useConversations"
import { UserProfile } from "@/types"
import { toast } from "sonner"

function ContactCard({
  contact,
  onMessage,
  isCreating,
}: {
  contact: UserProfile
  onMessage: (contact: UserProfile) => void
  isCreating: boolean
}) {
  const { status } = usePresence(contact.id)

  return (
    <div className="group flex items-center gap-4 rounded-xl border border-border-subtle bg-bg-surface p-4 transition-all hover:border-border-main hover:shadow-sm surface-glow">
      <AvatarWithPresence
        name={contact.name || "User"}
        src={contact.image || undefined}
        status={status}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-text-high truncate">{contact.name}</span>
          <RoleBadge role={contact.role} />
        </div>
        {contact.bio ? (
          <p className="text-sm text-text-medium truncate mt-0.5">{contact.bio}</p>
        ) : (
          <p className="text-sm text-text-low truncate mt-0.5">{contact.email}</p>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onMessage(contact)}
        disabled={isCreating}
        className="text-text-low hover:text-brand hover:bg-brand-subtle shrink-0 opacity-0 group-hover:opacity-100 transition-all"
      >
        <MessageSquare className="size-4" />
      </Button>
    </div>
  )
}

export function ContactsList({ initialContacts }: { initialContacts: UserProfile[] }) {
  const [search, setSearch] = useState("")
  const router = useRouter()
  const { mutate: createConversation, isPending } = useCreateConversation()

  const filtered = initialContacts.filter((c) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      c.name?.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.role.toLowerCase().includes(q)
    )
  })

  const handleMessage = (contact: UserProfile) => {
    createConversation(contact.id, {
      onSuccess: (data) => {
        router.push(`/dashboard/${data.id}`)
      },
      onError: () => {
        toast.error("Failed to open conversation")
      },
    })
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6 md:p-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-high">Contacts</h1>
          <p className="mt-1 text-sm text-text-medium">
            {initialContacts.length} {initialContacts.length === 1 ? "person" : "people"}{" "}
            you&apos;ve connected with
          </p>
        </div>
        <NewConversationButton variant="cta" />
      </div>

      {initialContacts.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-low" />
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 bg-bg-deep border-border-main pl-10 text-text-high placeholder:text-text-low focus-visible:border-brand focus-visible:ring-brand/25"
          />
        </div>
      )}

      {initialContacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="size-16 rounded-2xl bg-bg-muted flex items-center justify-center mb-6">
            <Users className="size-8 text-text-low" />
          </div>
          <h2 className="font-display text-lg font-semibold text-text-high mb-2">
            No contacts yet
          </h2>
          <p className="text-sm text-text-medium max-w-sm mb-6">
            Start a conversation with someone to add them to your contacts.
          </p>
          <NewConversationButton variant="cta" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-text-medium">
            No contacts match &ldquo;{search.trim()}&rdquo;
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onMessage={handleMessage}
              isCreating={isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}
