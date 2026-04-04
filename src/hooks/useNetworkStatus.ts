"use client"

import { useEffect, useState, useCallback } from "react"

export function useNetworkStatus() {
  const [online, setOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  )

  const goOnline = useCallback(() => setOnline(true), [])
  const goOffline = useCallback(() => setOnline(false), [])

  useEffect(() => {
    window.addEventListener("online", goOnline)
    window.addEventListener("offline", goOffline)
    return () => {
      window.removeEventListener("online", goOnline)
      window.removeEventListener("offline", goOffline)
    }
  }, [goOnline, goOffline])

  return online
}
