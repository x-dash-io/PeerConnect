"use client"

import { MessageCircle, Shield, Zap, Users } from "lucide-react"
import { motion } from "framer-motion"

const features = [
  {
    icon: MessageCircle,
    title: "Real-Time Messaging",
    description: "Instant delivery with read receipts, typing indicators, and rich media support.",
    gradient: "from-brand/20 to-accent-cyan/10",
    iconColor: "text-brand",
  },
  {
    icon: Users,
    title: "Role-Based Profiles",
    description:
      "Tailored experiences for peers, freelancers, and businesses — all in one platform.",
    gradient: "from-accent-cyan/20 to-brand/10",
    iconColor: "text-accent-cyan",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description:
      "Your data is encrypted in transit and at rest. Enterprise-grade security by default.",
    gradient: "from-presence/20 to-accent-cyan/10",
    iconColor: "text-presence",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Built on modern infrastructure for sub-100ms message delivery worldwide.",
    gradient: "from-brand/20 to-presence/10",
    iconColor: "text-brand",
  },
]

export function FeaturesSection() {
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
            Everything you need
          </span>
          <h2 className="text-3xl font-bold text-text-high md:text-5xl leading-tight">
            Built for <span className="text-gradient-brand">professional</span> communication
          </h2>
          <p className="mt-4 text-text-medium text-lg max-w-2xl mx-auto">
            PeerConnect combines the speed of instant messaging with the professionalism your work
            demands.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative rounded-2xl border border-border-subtle bg-bg-surface/60 backdrop-blur-sm p-8 transition-all duration-300 hover:border-brand/20 hover:bg-bg-surface hover:-translate-y-1 surface-glow overflow-hidden"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              />
              <div className="relative z-10">
                <div
                  className={`mb-5 inline-flex size-12 items-center justify-center rounded-xl bg-brand-subtle ${feature.iconColor} transition-colors group-hover:bg-brand/15`}
                >
                  <feature.icon className="size-6" />
                </div>
                <h3 className="text-xl font-bold text-text-high">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-text-medium">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
