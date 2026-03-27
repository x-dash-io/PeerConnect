import type { Metadata } from "next"
import { Manrope, Lato, JetBrains_Mono } from "next/font/google"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
})

const lato = Lato({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-lato",
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
      className={`${manrope.variable} ${lato.variable} ${jetbrainsMono.variable} dark`}
    >
      <body>
        <TooltipProvider>
          {children}
          <Toaster theme="dark" position="bottom-right" closeButton richColors />
        </TooltipProvider>
      </body>
    </html>
  )
}
