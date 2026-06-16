import type { Metadata } from "next"
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/providers/ThemeProvider"
import "./globals.css"

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
})

export const metadata: Metadata = {
  title: "PeerConnect — Professional Messaging",
  description: "Premium messaging for peers, freelancers, and businesses.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider>
          <TooltipProvider>
            {children}
            <Toaster position="bottom-right" closeButton richColors />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
