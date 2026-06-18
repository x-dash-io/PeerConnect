"use client"

import { motion } from "framer-motion"
import { Users, MessageSquare, Clock, Globe } from "lucide-react"

const stats = [
  { icon: Users, value: "10,000+", label: "Active users" },
  { icon: MessageSquare, value: "1M+", label: "Messages sent" },
  { icon: Clock, value: "99.9%", label: "Uptime" },
  { icon: Globe, value: "50+", label: "Countries" },
]

export function StatsSection() {
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
            Trusted by professionals
          </span>
          <h2 className="text-3xl font-bold text-text-high md:text-5xl leading-tight">
            Growing <span className="text-gradient-brand">fast</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col items-center rounded-2xl border border-border-subtle bg-bg-surface/60 backdrop-blur-sm p-8 text-center surface-glow"
            >
              <div className="mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-brand-subtle text-brand">
                <stat.icon className="size-6" />
              </div>
              <span className="text-3xl font-bold text-text-high md:text-4xl font-display">
                {stat.value}
              </span>
              <span className="mt-2 text-sm text-text-medium">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
