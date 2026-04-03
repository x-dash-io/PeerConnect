"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Loader2 } from "lucide-react"
import { useCreateConversation } from "@/hooks/useConversations"
import { useQuery } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { RoleBadge } from "@/components/shared/RoleBadge"
import { UserProfile } from "@/types"
import { toast } from "sonner"

export function NewConversationButton({ variant = "icon" }: { variant?: "icon" | "cta" }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const router = useRouter()
  const { mutate: createConversation, isPending: isCreating } = useCreateConversation()

  const { data: users, isLoading } = useQuery<UserProfile[]>({
    queryKey: ["users", "search", search],
    queryFn: async () => {
      if (search.length < 2) return []
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(search)}`)
      if (!res.ok) throw new Error("Failed to search users")
      return res.json()
    },
    enabled: search.length >= 2,
  })

  const handleSelectUser = (user: UserProfile) => {
    createConversation(user.id, {
      onSuccess: (data) => {
        setOpen(false)
        router.push(`/dashboard/${data.id}`)
        toast.success(`Started conversation with ${user.name}`)
      },
      onError: (error) => {
        toast.error(error.message || "Failed to start conversation")
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          variant === "cta" ? (
            <Button variant="outline" size="sm" className="gap-2 text-text-medium" />
          ) : (
            <Button variant="ghost" size="icon" className="text-text-medium hover:text-text-high" />
          )
        }
      >
        <Plus className="size-4" />
        {variant === "cta" && <span>Start a conversation</span>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-border-main bg-bg-surface">
        <DialogHeader className="p-4 border-b border-border-subtle">
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>
        <Command className="bg-transparent" shouldFilter={false}>
          <CommandInput
            placeholder="Search for users..."
            value={search}
            onValueChange={setSearch}
            className="h-12"
          />
          <CommandList className="max-h-[300px]">
            {isLoading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="size-6 animate-spin text-brand" />
              </div>
            )}
            {!isLoading && search.length >= 2 && users?.length === 0 && (
              <CommandEmpty>No users found for &ldquo;{search.trim()}&rdquo;</CommandEmpty>
            )}
            {!isLoading && search.length < 2 && (
              <div className="py-6 text-center text-sm text-text-low">
                Type at least 2 characters to search...
              </div>
            )}
            <CommandGroup>
              {users?.map((user) => (
                <CommandItem
                  key={user.id}
                  onSelect={() => handleSelectUser(user)}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-bg-muted"
                  disabled={isCreating}
                >
                  <UserAvatar name={user.name || "User"} src={user.image || undefined} size="sm" />
                  <div className="flex flex-1 flex-col truncate">
                    <span className="font-medium text-text-high truncate">{user.name}</span>
                    <span className="text-xs text-text-low truncate">{user.email}</span>
                  </div>
                  <RoleBadge role={user.role} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
