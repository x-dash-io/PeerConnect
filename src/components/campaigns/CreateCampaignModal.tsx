"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { X, Send, Search, Users, Loader2, Check, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Contact {
  id: string
  name: string | null
  email: string
  image: string | null
  role: string
}

export function CreateCampaignModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState<"select" | "compose">("select")
  const [search, setSearch] = useState("")
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (open) {
      setStep("select")
      setSearch("")
      setSelectedIds([])
      setMessage("")
      setTimeout(() => searchRef.current?.focus(), 50)
    }
  }, [open])

  const searchContacts = useCallback(async (q: string) => {
    if (q.length < 2) {
      setContacts([])
      return
    }
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`)
      setContacts(await res.json())
    } catch {
      setContacts([])
    }
  }, [])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchContacts(value), 300)
  }

  const toggleRecipient = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const handleSend = async () => {
    if (!message.trim() || selectedIds.length === 0 || sending) return
    setSending(true)
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message.trim(), recipientIds: selectedIds }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to send")
      }
      toast.success(`Campaign sent to ${selectedIds.length} recipient(s)`)
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send campaign")
    } finally {
      setSending(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-border-subtle bg-bg-surface shadow-2xl surface-glow overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3.5 border-b border-border-subtle">
          {step === "compose" && (
            <button
              onClick={() => setStep("select")}
              className="size-8 rounded-lg flex items-center justify-center text-text-low hover:text-text-high hover:bg-bg-muted transition-colors"
            >
              <ArrowLeft className="size-4" />
            </button>
          )}
          <h2 className="font-display text-base font-bold text-text-high flex-1">
            {step === "select" ? "Select Recipients" : "Compose Message"}
          </h2>
          <button
            onClick={onClose}
            className="size-8 rounded-lg flex items-center justify-center text-text-low hover:text-text-high hover:bg-bg-muted transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {step === "select" ? (
          <>
            {/* Search */}
            <div className="px-4 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-low" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search users..."
                  className="w-full h-9 rounded-xl bg-bg-deep border border-border-main pl-9 pr-3 text-sm text-text-high placeholder:text-text-low outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                />
              </div>
            </div>

            {/* Selected count */}
            {selectedIds.length > 0 && (
              <div className="px-4 py-2 bg-brand-subtle/30 border-y border-brand/10 text-sm text-brand font-medium">
                {selectedIds.length} recipient{selectedIds.length > 1 ? "s" : ""} selected
              </div>
            )}

            {/* Contacts list */}
            <div className="max-h-60 overflow-y-auto p-2">
              {contacts.length === 0 && search.length >= 2 && (
                <div className="flex flex-col items-center py-8 text-center">
                  <Users className="size-8 text-text-low mb-2" />
                  <p className="text-sm text-text-medium">No users found</p>
                </div>
              )}
              {contacts.length === 0 && search.length < 2 && (
                <div className="flex flex-col items-center py-8 text-center">
                  <Users className="size-8 text-text-low mb-2" />
                  <p className="text-sm text-text-medium">Type at least 2 characters to search</p>
                </div>
              )}
              {contacts.map((contact) => {
                const selected = selectedIds.includes(contact.id)
                return (
                  <button
                    key={contact.id}
                    onClick={() => toggleRecipient(contact.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
                      selected ? "bg-brand-subtle" : "hover:bg-bg-muted",
                    )}
                  >
                    <UserAvatar
                      name={contact.name || contact.email}
                      src={contact.image ?? undefined}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-text-high truncate">
                        {contact.name || "Unnamed"}
                      </p>
                      <p className="text-xs text-text-low truncate">{contact.email}</p>
                    </div>
                    <div
                      className={cn(
                        "size-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                        selected ? "bg-brand border-brand" : "border-border-main",
                      )}
                    >
                      {selected && <Check className="size-3 text-white" />}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border-subtle">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-border-main text-text-medium"
              >
                Cancel
              </Button>
              <Button
                onClick={() => selectedIds.length > 0 && setStep("compose")}
                disabled={selectedIds.length === 0}
                className="bg-brand text-white hover:bg-brand-hover"
              >
                Next
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Recipients summary */}
            <div className="px-4 py-3 flex flex-wrap gap-1.5 border-b border-border-subtle">
              {selectedIds.slice(0, 10).map((id) => {
                const contact = contacts.find((c) => c.id === id)
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 rounded-full bg-brand-subtle px-2.5 py-1 text-xs font-medium text-brand"
                  >
                    {contact?.name || "User"}
                    <button onClick={() => toggleRecipient(id)}>
                      <X className="size-3" />
                    </button>
                  </span>
                )
              })}
              {selectedIds.length > 10 && (
                <span className="text-xs text-text-low">+{selectedIds.length - 10} more</span>
              )}
            </div>

            {/* Message composer */}
            <div className="p-4">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your campaign message..."
                rows={5}
                className="w-full rounded-xl border border-border-main bg-bg-deep px-3.5 py-2.5 text-sm text-text-high placeholder:text-text-low outline-none resize-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
              />
              <p className="mt-1.5 text-xs text-text-low">
                This message will be sent as individual 1-on-1 conversations to each recipient.
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border-subtle">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-border-main text-text-medium"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={!message.trim() || sending}
                className="gap-2 bg-brand text-white hover:bg-brand-hover"
              >
                {sending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Send to {selectedIds.length} recipient{selectedIds.length > 1 ? "s" : ""}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
