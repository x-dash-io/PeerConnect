import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/* ── Conversation list item skeleton ── */
export function SkeletonConversationItem() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 h-[72px]">
      <Skeleton className="size-11 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-10" />
        </div>
        <Skeleton className="h-3 w-[70%]" />
      </div>
    </div>
  )
}

/* ── Message bubble skeleton ── */
export function SkeletonMessage({ isSelf }: { isSelf: boolean }) {
  return (
    <div className={cn("flex w-full mb-1", isSelf ? "justify-end" : "justify-start")}>
      <div className={cn("flex max-w-[70%] gap-2", isSelf ? "flex-row-reverse" : "flex-row")}>
        {/* Avatar placeholder for other user */}
        {!isSelf && <Skeleton className="size-7 shrink-0 rounded-full mt-auto mb-1" />}

        <div className="flex flex-col gap-1">
          {!isSelf && <Skeleton className="h-2.5 w-14 ml-1" />}
          <Skeleton
            className={cn(
              "rounded-[18px] px-3.5 py-2",
              isSelf ? "h-10 w-44 rounded-br-sm" : "h-10 w-52 rounded-tl-sm",
            )}
          />
        </div>
      </div>
    </div>
  )
}

/* ── Chat header skeleton ── */
export function SkeletonChatHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border-subtle glass-heavy px-4">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="hidden md:block size-9 rounded-lg" />
        <Skeleton className="hidden md:block size-9 rounded-lg" />
        <Skeleton className="size-9 rounded-lg" />
      </div>
    </header>
  )
}
