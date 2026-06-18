"use client"

import { Users, Briefcase, Zap, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import Link from "next/link"

const roles = [
  {
    icon: Users,
    title: "Peers",
    description:
      "Collaborate with colleagues and partners in real-time. Share files, coordinate projects, and stay in sync.",
    gradient: "from-brand/20 to-accent-cyan/10",
  },
  {
    icon: Briefcase,
    title: "Businesses",
    description:
      "Manage client relationships with professional messaging. Organize conversations, track responses, and grow.",
    gradient: "from-accent-cyan/20 to-brand/10",
  },
  {
    icon: Zap,
    title: "Freelancers",
    description:
      "Independent professionals get the tools they need. Smart inbox, campaign tools, and seamless client communication.",
    gradient: "from-presence/20 to-accent-cyan/10",
  },
]

export function RolesSection() {
  return (
    <section className="relative min-h-screen snap-start flex items-center justify-center bg-bg-deep px-6 md:px-12 lg:px-20">
      <div className="w-full max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-border-subtle px-4 py-1.5 text-sm text-text-medium font-medium mb-6">
            One platform, three perspectives
          </span>
          <h2 className="text-3xl font-bold text-text-high md:text-5xl leading-tight">
            Designed for <span className="text-gradient-brand">every role</span>
          </h2>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {roles.map((role, i) => (
            <motion.div
              key={role.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="group relative rounded-2xl border border-border-subtle bg-bg-surface/60 backdrop-blur-sm p-8 transition-all duration-300 hover:border-brand/20 hover:bg-bg-surface hover:-translate-y-1 surface-glow overflow-hidden"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${role.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              />
              <div className="relative z-10">
                <div className="mb-5 inline-flex size-12 items-center justify-center rounded-xl bg-brand-subtle text-brand">
                  <role.icon className="size-6" />
                </div>
                <h3 className="text-xl font-bold text-text-high">{role.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-text-medium">{role.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 text-center"
        >
          <Link href="/register">
            <Button
              size="lg"
              className="h-12 gap-2 bg-brand px-8 text-white hover:bg-brand-hover shadow-lg glow-brand-sm active:scale-[0.98] transition-all"
            >
              Find Your Role
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
