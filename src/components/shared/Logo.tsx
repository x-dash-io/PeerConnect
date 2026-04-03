import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  imageSize?: number
  showText?: boolean
  textClassName?: string
  href?: string
}

export function Logo({
  className,
  imageSize = 40,
  showText = true,
  textClassName,
  href = "/",
}: LogoProps) {
  const content = (
    <div className={cn("flex items-center gap-3 group", className)}>
      <div className="relative">
        <Image
          src="/peerconnect-brand.png"
          alt="PeerConnect Logo"
          width={imageSize}
          height={imageSize}
          className="relative z-10 drop-shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-transform duration-300 group-hover:scale-110"
          priority
        />
        <div className="absolute inset-0 z-0 bg-brand/20 blur-2xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
      {showText && (
        <span
          className={cn(
            "text-xl font-bold font-display text-text-high tracking-tight",
            textClassName,
          )}
        >
          PeerConnect
        </span>
      )}
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
