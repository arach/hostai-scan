import { 
  Gauge, 
  Search, 
  Shield, 
  Smartphone, 
  Star, 
  Zap 
} from "lucide-react"

const features = [
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
    <section id="features" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Complete website analysis
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Our AI-powered audit checks over 50 factors specifically calibrated 
            for short-term rental websites and vacation property businesses.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="rounded-xl border border-border bg-card p-6 transition-colors hover:bg-secondary/50"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
