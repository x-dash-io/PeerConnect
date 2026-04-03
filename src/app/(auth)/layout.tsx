"use client"

import { Logo } from "@/components/shared/Logo"
import { motion, AnimatePresence } from "framer-motion"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-deep flex">
      {/* Left branding panel — hidden on mobile */}
      <div className="relative hidden w-[45%] overflow-hidden lg:flex lg:flex-col lg:justify-between">
        {/* Animated Gradient mesh background */}
        <div className="absolute inset-0">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.08, 0.12, 0.08],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-[30%] -left-[20%] h-[80%] w-[70%] rounded-full bg-brand blur-[100px]"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.04, 0.08, 0.04],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-[20%] -right-[10%] h-[60%] w-[50%] rounded-full bg-brand blur-[80px]"
          />
          <motion.div
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.03, 0.06, 0.03],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[10%] left-[20%] h-[40%] w-[30%] rounded-full bg-presence blur-[60px]"
          />
        </div>

        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle, #ededed 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Border on right edge */}
        <div className="absolute inset-y-0 right-0 w-px bg-border-main/50" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-12">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Logo />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <Logo
              href=""
              imageSize={64}
              showText={false}
              className="drop-shadow-[0_0_30px_rgba(99,102,241,0.25)]"
            />
            <h2 className="text-4xl font-extrabold text-text-high leading-[1.15] tracking-tight">
              Professional messaging, <span className="text-gradient-indigo">reimagined.</span>
            </h2>
            <p className="max-w-sm text-lg text-text-medium leading-relaxed">
              Connect with peers, freelancers, and businesses in a workspace designed for meaningful
              conversations and seamless collaboration.
            </p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-sm text-text-low font-medium"
          >
            &copy; {new Date().getFullYear()} PeerConnect. Built for the modern professional.
          </motion.p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="relative flex flex-1 flex-col items-center justify-center p-6 sm:p-12 lg:p-20">
        {/* Subtle background for mobile */}
        <div className="pointer-events-none absolute inset-0 lg:hidden overflow-hidden">
          <div className="absolute -top-[20%] -right-[10%] h-[50%] w-[60%] rounded-full bg-brand/[0.05] blur-[80px]" />
          <div className="absolute bottom-[0%] -left-[10%] h-[40%] w-[50%] rounded-full bg-presence/[0.03] blur-[60px]" />
        </div>

        {/* Mobile logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 mb-12 lg:hidden"
        >
          <Logo imageSize={44} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 w-full max-w-md"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key="auth-content"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
