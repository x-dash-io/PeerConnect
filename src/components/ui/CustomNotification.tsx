"use client"

import { useEffect, useState, ReactNode } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface CustomNotificationProps {
  message: ReactNode
  type?: "success" | "error" | "warning" | "info"
  duration?: number
  onClose?: () => void
  className?: string
}

function CustomNotification({
  message,
  type = "info",
  duration = 3000,
  onClose,
  className,
}: CustomNotificationProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => {
        onClose?.()
      }, 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const colors = {
    success:
      "bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200",
    error:
      "bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200",
    warning:
      "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200",
    info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200",
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg",
        "transition-all duration-300 ease-in-out",
        colors[type],
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
        className,
      )}
    >
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={() => {
          setIsVisible(false)
          setTimeout(() => {
            onClose?.()
          }, 300)
        }}
        className="ml-auto size-5 rounded-full hover:bg-current/20 transition-colors"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}

interface CustomNotificationContainerProps {
  notifications: Array<{ id: string } & CustomNotificationProps>
  onRemove: (id: string) => void
}

export function CustomNotificationContainer({
  notifications,
  onRemove,
}: CustomNotificationContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {notifications.map((notification) => (
        <CustomNotification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          duration={notification.duration}
          onClose={() => onRemove(notification.id)}
        />
      ))}
    </div>
  )
}
