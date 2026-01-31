import { Globe, Zap, Search, Eye, Calculator } from "lucide-react"
import type { AuditPhase } from "./types"

/**
 * Default audit phases for the GetHost.AI scanner
 * Each phase represents ~20% of the total scan time by default
 */
export const DEFAULT_PHASES: AuditPhase[] = [
  {
    id: "domain",
    name: "Domain Discovery",
    description: "Analyzing domain & web presence",
    icon: <Globe className="h-5 w-5" />,
    color: "accent",
    weight: 15,
    items: [
      "whois-lookup.ts",
      "dns-records.json",
      "ssl-certificate.ts",
      "domain-history.tsx",
      "web-archive.ts",
      "social-profiles.json",
    ],
  },
  {
    id: "performance",
    name: "Performance Audit",
    description: "Evaluating speed & Core Web Vitals",
    icon: <Zap className="h-5 w-5" />,
    color: "warning",
    weight: 25,
    items: [
      "lighthouse-core.ts",
      "pagespeed-api.json",
      "dom-analysis.tsx",
      "resource-timing.ts",
      "core-web-vitals.ts",
      "network-waterfall.json",
      "render-blocking.ts",
      "image-optimization.tsx",
    ],
  },
  {
    id: "seo",
    name: "SEO Analysis",
    description: "Scanning search optimization metrics",
    icon: <Search className="h-5 w-5" />,
    color: "accent",
    weight: 20,
    items: [
      "meta-tags.ts",
      "schema-markup.json",
      "sitemap-parser.tsx",
      "robots-txt.ts",
      "backlink-analysis.ts",
      "keyword-density.json",
      "canonical-urls.ts",
      "heading-structure.tsx",
      "alt-text-audit.ts",
    ],
  },
  {
    id: "ui",
    name: "Conversion Audit",
    description: "Assessing booking flow & trust signals",
    icon: <Eye className="h-5 w-5" />,
    color: "destructive",
    weight: 25,
    items: [
      "mobile-responsive.ts",
      "accessibility-a11y.json",
      "color-contrast.tsx",
      "touch-targets.ts",
      "visual-hierarchy.ts",
      "booking-flow.json",
      "trust-signals.tsx",
      "cta-placement.ts",
    ],
  },
  {
    id: "scoring",
    name: "Calculating Scores",
    description: "Computing final audit results",
    icon: <Calculator className="h-5 w-5" />,
    color: "accent",
    weight: 15,
    items: [
      "performance-score.ts",
      "seo-score.ts",
      "conversion-score.ts",
      "trust-score.ts",
      "content-score.ts",
      "security-score.ts",
      "overall-weighted-score.ts",
    ],
  },
]

/** Get phase by ID */
export function getPhase(id: string): AuditPhase | undefined {
  return DEFAULT_PHASES.find(p => p.id === id)
}

/** Calculate phase boundaries based on weights */
export function getPhaseTimings(phases: AuditPhase[], totalDuration: number) {
  const totalWeight = phases.reduce((sum, p) => sum + (p.weight || 20), 0)
  let accumulated = 0

  return phases.map(phase => {
    const weight = phase.weight || 20
    const start = accumulated
    const duration = (weight / totalWeight) * totalDuration
    accumulated += duration

    return {
      phase,
      startMs: start,
      endMs: accumulated,
      durationMs: duration,
    }
  })
}
