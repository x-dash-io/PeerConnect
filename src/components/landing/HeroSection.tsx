"use client"

import { Sparkles, ArrowRight, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/shared/Logo"
import { AnimatedBackground, GridOverlay } from "@/components/shared/AnimatedBackground"
import { motion } from "framer-motion"
import Link from "next/link"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.3 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

export function HeroSection() {
  return (
    <section className="relative min-h-screen snap-start flex flex-col bg-bg-deep overflow-hidden">
      <AnimatedBackground />
      <GridOverlay />

      <nav className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12 lg:px-20">
        <Logo />
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button
              variant="ghost"
              className="text-text-medium hover:text-text-high hover:bg-bg-muted"
            >
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button className="bg-brand text-white hover:bg-brand-hover shadow-lg glow-brand-sm">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 md:px-12 lg:px-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center text-center max-w-4xl"
        >
          <motion.div
            variants={itemVariants}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-subtle px-4 py-1.5 text-sm text-brand font-medium"
          >
            <Sparkles className="size-3.5" />
            Now in early access
          </motion.div>

          <motion.div variants={itemVariants} className="mb-8">
            <Logo
              href=""
              imageSize={88}
              showText={false}
              className="drop-shadow-[0_0_40px_var(--brand-glow)]"
            />
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-4xl font-extrabold tracking-tight text-text-high md:text-6xl lg:text-7xl leading-[1.08]"
          >
            Where professionals <span className="text-gradient-brand">connect and collaborate</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mt-6 max-w-xl text-lg text-text-medium md:text-xl leading-relaxed"
          >
            A premium messaging platform built for peers, freelancers, and businesses. Fast,
            private, and beautifully designed.
          </motion.p>

          <motion.div variants={itemVariants} className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link href="/register">
              <Button
                size="lg"
                className="h-12 gap-2 bg-brand px-8 text-white hover:bg-brand-hover shadow-lg glow-brand-sm active:scale-[0.98] transition-all"
              >
                Get Started Free
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="h-12 border-border-main bg-bg-surface/50 backdrop-blur-sm px-8 text-text-high hover:bg-bg-muted"
              >
                Sign In
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-text-low"
      >
        <span className="text-xs font-medium tracking-wide uppercase">Scroll</span>
        <ChevronDown className="size-4 animate-bounce" />
      </motion.div>
    </section>
  )
}
