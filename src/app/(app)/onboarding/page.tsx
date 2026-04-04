"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Users, Briefcase, Zap, CheckCircle, ArrowRight, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { UserRole } from "@/types"

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 400 : -400,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 400 : -400,
    opacity: 0,
    transition: { duration: 0.2 },
  }),
}

const roles = [
  {
    value: "PEER" as UserRole,
    icon: Users,
    name: "Connect with Peers",
    description: "Collaborate and communicate with colleagues and partners",
  },
  {
    value: "BUSINESS" as UserRole,
    icon: Briefcase,
    name: "Business Owner",
    description: "Manage client relationships and team communication",
  },
  {
    value: "FREELANCER" as UserRole,
    icon: Zap,
    name: "Freelancer",
    description: "Professional tools for independent workers",
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [saving, setSaving] = useState(false)

  function goToStep(next: number) {
    setDirection(next > step ? 1 : -1)
    setStep(next)
  }

  async function handleFinish() {
    if (!selectedRole) return
    setSaving(true)

    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: selectedRole }),
    })

    if (!res.ok) {
      setSaving(false)
      return
    }

    router.push("/dashboard")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-deep p-4">
      {/* Subtle background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/3 h-[40%] w-[40%] rounded-full bg-brand/6 blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 h-[30%] w-[30%] rounded-full bg-accent-cyan/4 blur-[80px]" />
      </div>

      <div className="relative w-full max-w-2xl overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          {step === 0 && (
            <motion.div
              key="welcome"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="flex flex-col items-center text-center"
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-subtle px-4 py-1.5 text-sm text-brand font-medium">
                <Sparkles className="size-3.5" />
                Welcome aboard
              </div>
              <h1 className="text-4xl font-extrabold text-gradient-brand tracking-tight sm:text-5xl">
                Welcome to PeerConnect
              </h1>
              <p className="mt-4 max-w-md text-lg text-text-medium leading-relaxed">
                Professional messaging designed for how you work
              </p>
              <Button
                onClick={() => goToStep(1)}
                className="mt-10 h-11 gap-2 bg-brand px-6 text-white hover:bg-brand-hover shadow-lg glow-brand-sm active:scale-[0.98] transition-all"
              >
                Get Started
                <ArrowRight className="size-4" />
              </Button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="role"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="flex flex-col items-center"
            >
              <h2 className="text-2xl font-bold text-text-high sm:text-3xl">
                How do you use PeerConnect?
              </h2>
              <p className="mt-2 text-text-medium">Choose your role — you can change this later</p>

              <div className="mt-8 grid w-full gap-4 sm:grid-cols-3">
                {roles.map((role) => {
                  const selected = selectedRole === role.value
                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => setSelectedRole(role.value)}
                      className={`relative flex flex-col items-center rounded-2xl p-6 text-center transition-all duration-200 cursor-pointer ${
                        selected
                          ? "border-2 border-brand bg-brand-subtle shadow-sm glow-brand-sm"
                          : "border border-border-main bg-bg-surface hover:bg-bg-muted"
                      }`}
                    >
                      {selected && (
                        <span className="absolute top-2 right-2 flex items-center justify-center rounded-full bg-brand p-0.5">
                          <CheckCircle className="size-4 text-white" />
                        </span>
                      )}
                      <role.icon
                        className={`size-8 ${selected ? "text-brand" : "text-text-medium"}`}
                      />
                      <h3 className="mt-3 text-sm font-semibold text-text-high">{role.name}</h3>
                      <p className="mt-1 text-xs text-text-medium leading-relaxed">
                        {role.description}
                      </p>
                    </button>
                  )
                })}
              </div>

              <Button
                onClick={handleFinish}
                disabled={!selectedRole || saving}
                className="mt-8 h-11 gap-2 bg-brand px-6 text-white hover:bg-brand-hover shadow-lg glow-brand-sm active:scale-[0.98] transition-all disabled:opacity-40"
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    Continue
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
