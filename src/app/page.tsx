"use client"

import { MessageCircle, Shield, Zap, Users, ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/shared/Logo"
import { AnimatedBackground, GridOverlay } from "@/components/shared/AnimatedBackground"
import { motion } from "framer-motion"
import Link from "next/link"

const features = [
  {
    icon: MessageCircle,
    title: "Real-Time Messaging",
    description: "Instant delivery with read receipts, typing indicators, and rich media support.",
  },
  {
    icon: Users,
    title: "Role-Based Profiles",
    description:
      "Tailored experiences for peers, freelancers, and businesses — all in one platform.",
  },
  {
    icon: Shield,
    title: "End-to-End Privacy",
    description: "Your conversations stay yours. Enterprise-grade security by default.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Built on modern infrastructure for sub-100ms message delivery worldwide.",
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
}

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-bg-deep overflow-hidden">
      <AnimatedBackground />
      <GridOverlay />

      {/* Navigation */}
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

      {/* Hero */}
      <main className="relative z-10 mx-auto max-w-5xl px-6 pt-20 pb-32 md:pt-32 md:pb-40 lg:px-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center text-center"
        >
          {/* Badge */}
          <motion.div
            variants={itemVariants}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-subtle px-4 py-1.5 text-sm text-brand font-medium"
          >
            <Sparkles className="size-3.5" />
            Now in early access
          </motion.div>

          {/* Logo mark */}
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
            className="max-w-3xl text-4xl font-extrabold tracking-tight text-text-high md:text-6xl lg:text-7xl leading-[1.08]"
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

          {/* CTAs */}
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

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-32 grid gap-4 sm:grid-cols-2 lg:mt-40"
        >
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-border-subtle bg-bg-surface/60 backdrop-blur-sm p-6 transition-all duration-300 hover:border-brand/20 hover:bg-bg-surface hover:-translate-y-1 surface-glow"
            >
              <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-brand-subtle text-brand transition-colors group-hover:bg-brand/15">
                <feature.icon className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-text-high">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-medium">{feature.description}</p>
            </div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-32 flex flex-col items-center text-center lg:mt-48"
        >
          <h2 className="text-3xl font-bold text-text-high md:text-4xl">Ready to get started?</h2>
          <p className="mt-4 text-text-medium max-w-md">
            Join PeerConnect today and upgrade your professional communication experience.
          </p>
          <Link href="/register" className="mt-8">
            <Button
              size="lg"
              className="h-12 gap-2 bg-brand px-10 text-white hover:bg-brand-hover shadow-lg glow-brand-sm active:scale-[0.98] transition-all"
            >
              Create Your Account
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border-subtle px-6 py-12 text-center text-sm text-text-low md:px-12">
        <div className="flex flex-col items-center gap-4">
          <Logo
            showText={false}
            imageSize={24}
            className="opacity-50 grayscale hover:grayscale-0 transition-all"
          />
          <p>&copy; {new Date().getFullYear()} PeerConnect. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
