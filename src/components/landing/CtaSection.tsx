"use client"

import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import Link from "next/link"

export function CtaSection() {
  return (
    <section className="relative min-h-screen snap-start flex items-center justify-center bg-bg-deep px-6 md:px-12 lg:px-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="flex flex-col items-center text-center max-w-2xl"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-subtle px-4 py-1.5 text-sm text-brand font-medium mb-8"
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-brand" />
          </span>
          Free during early access
        </motion.div>

        <h2 className="text-3xl font-bold text-text-high md:text-5xl leading-tight">
          Ready to <span className="text-gradient-brand">transform</span> your communication?
        </h2>
        <p className="mt-4 text-lg text-text-medium max-w-md">
          Join thousands of professionals already using PeerConnect. Sign up free, no credit card
          required.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link href="/register">
            <Button
              size="lg"
              className="h-12 gap-2 bg-brand px-10 text-white hover:bg-brand-hover shadow-lg glow-brand-sm active:scale-[0.98] transition-all"
            >
              Create Your Account
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
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="absolute bottom-8 left-0 right-0 text-center text-sm text-text-low"
        >
          <p>&copy; {new Date().getFullYear()} PeerConnect. All rights reserved.</p>
        </motion.footer>
      </motion.div>
    </section>
  )
}
