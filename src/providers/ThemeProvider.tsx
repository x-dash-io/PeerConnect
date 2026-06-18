"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useServerInsertedHTML } from "next/navigation"

type Theme = "light" | "dark" | "system"

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  setTheme: () => {},
})

const STORAGE_KEY = "theme"
const DEFAULT_THEME: Theme = "dark"

function applyThemeToDom(theme: Theme) {
  const resolved =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme
  document.documentElement.classList.remove("light", "dark")
  document.documentElement.classList.add(resolved)
  document.documentElement.style.colorScheme = resolved
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return DEFAULT_THEME
    try {
      return (localStorage.getItem(STORAGE_KEY) as Theme) || DEFAULT_THEME
    } catch {
      return DEFAULT_THEME
    }
  })

  useServerInsertedHTML(() => (
    <script
      dangerouslySetInnerHTML={{
        __html: `try{var t=localStorage.getItem("${STORAGE_KEY}")||"${DEFAULT_THEME}";t==="system"&&(t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.classList.remove("light","dark");document.documentElement.classList.add(t);document.documentElement.style.colorScheme=t}catch(e){}`,
      }}
    />
  ))

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    localStorage.setItem(STORAGE_KEY, t)
    applyThemeToDom(t)
  }, [])

  useEffect(() => {
    if (theme !== "system") return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => applyThemeToDom("system")
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [theme])

  const value: ThemeContextValue = { theme, setTheme }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}
