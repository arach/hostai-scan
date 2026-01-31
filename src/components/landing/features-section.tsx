"use client"

import {
  Gauge,
  Search,
  Shield,
  Smartphone,
  Star,
  Zap,
  type LucideIcon
} from "lucide-react"

interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

const features: Feature[] = [
  {
    icon: Gauge,
    title: "Performance Analysis",
    description: "Page speed, Core Web Vitals, and mobile performance metrics that directly impact your search rankings and guest experience.",
  },
  {
    icon: Search,
    title: "SEO Health Check",
    description: "Meta tags, structured data, keyword optimization, and technical SEO factors critical for vacation rental visibility.",
  },
  {
    icon: Shield,
    title: "Trust & Security",
    description: "SSL certificates, trust signals, reviews integration, and security indicators that build guest confidence.",
  },
  {
    icon: Smartphone,
    title: "Mobile Experience",
    description: "Mobile responsiveness, touch targets, and usability issues that affect the 60%+ of travelers booking on mobile.",
  },
  {
    icon: Star,
    title: "Conversion Optimization",
    description: "Booking CTAs, availability displays, pricing clarity, and friction points in your guest journey.",
  },
  {
    icon: Zap,
    title: "Quick Wins",
    description: "Prioritized, actionable fixes ranked by expected booking impact so you know exactly where to start.",
  },
]

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="px-4 py-20 sm:px-6 lg:px-8"
      style={{ background: "#fff" }}
    >
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <h2
            className="mb-4 text-3xl font-normal sm:text-4xl"
            style={{
              color: "#001821",
              letterSpacing: "-0.015em",
            }}
          >
            Complete website analysis
          </h2>
          <p
            className="mx-auto max-w-2xl"
            style={{
              color: "#61686b",
              fontSize: "16px",
              lineHeight: 1.6,
            }}
          >
            Our AI-powered audit checks over 50 factors specifically calibrated
            for short-term rental websites and vacation property businesses.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group rounded-[10px] p-6 transition-all hover:shadow-md"
              style={{
                background: "#fff",
                border: "1px solid #e0e4e6",
                boxShadow: "0px 1px 1px -0.5px rgba(0, 0, 0, 0.05)",
              }}
            >
              {/* Icon */}
              <div
                className="mb-4 flex h-10 w-10 items-center justify-center rounded-[10px] transition-transform group-hover:scale-105"
                style={{
                  background: "linear-gradient(90deg, rgba(87, 83, 198, 0.1) 0%, rgba(202, 36, 77, 0.1) 100%)",
                }}
              >
                <feature.icon
                  className="h-5 w-5"
                  style={{ color: "#5753c6" }}
                  strokeWidth={1.5}
                />
              </div>

              {/* Title */}
              <h3
                className="mb-2 font-normal"
                style={{
                  color: "#001821",
                  fontSize: "16px",
                  letterSpacing: "-0.005em",
                }}
              >
                {feature.title}
              </h3>

              {/* Description */}
              <p
                className="text-sm leading-relaxed"
                style={{ color: "#61686b" }}
              >
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
