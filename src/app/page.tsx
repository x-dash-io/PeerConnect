"use client"

import { useState, useEffect } from "react"
import { HeroSection } from "@/components/landing/HeroSection"
import { FeaturesSection } from "@/components/landing/FeaturesSection"
import { StatsSection } from "@/components/landing/StatsSection"
import { RolesSection } from "@/components/landing/RolesSection"
import { CtaSection } from "@/components/landing/CtaSection"
import { cn } from "@/lib/utils"

const sections = [
  { id: "hero", label: "Home" },
  { id: "features", label: "Features" },
  { id: "stats", label: "Stats" },
  { id: "roles", label: "Roles" },
  { id: "cta", label: "Get Started" },
]

export default function HomePage() {
  const [activeSection, setActiveSection] = useState(0)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = sections.findIndex((s) => s.id === entry.target.id)
            if (idx >= 0) setActiveSection(idx)
          }
        }
      },
      { threshold: 0.5 },
    )

    const elements = sections.map((s) => document.getElementById(s.id)).filter(Boolean)
    elements.forEach((el) => el && observer.observe(el))
    return () => elements.forEach((el) => el && observer.unobserve(el))
  }, [])

  const scrollTo = (idx: number) => {
    const el = document.getElementById(sections[idx].id)
    el?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="relative h-screen overflow-y-auto snap-y snap-mandatory scroll-smooth">
      {/* Nav dots */}
      <nav className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3">
        {sections.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => scrollTo(i)}
            className="group relative flex items-center justify-center size-4"
            aria-label={s.label}
          >
            <span
              className={cn(
                "block rounded-full transition-all duration-300",
                i === activeSection
                  ? "size-3 bg-brand shadow-lg glow-brand-sm"
                  : "size-2 bg-border-main group-hover:size-2.5 group-hover:bg-text-medium",
              )}
            />
            <span className="absolute right-full mr-3 px-2 py-0.5 rounded-md bg-bg-elevated text-xs text-text-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              {s.label}
            </span>
          </button>
        ))}
      </nav>

      <section id="hero">
        <HeroSection />
      </section>
      <section id="features">
        <FeaturesSection />
      </section>
      <section id="stats">
        <StatsSection />
      </section>
      <section id="roles">
        <RolesSection />
      </section>
      <section id="cta">
        <CtaSection />
      </section>
    </div>
  )
}
