"use client"

import { useEffect, useState, useMemo } from "react"
import { Globe, Zap, Search, Eye, Calculator, Check } from "lucide-react"
import type { AuditPhase } from "./types"

// Compact phase icons for the progress track
const PHASE_ICONS: Record<string, React.ReactNode> = {
  domain: <Globe className="h-3.5 w-3.5" />,
  performance: <Zap className="h-3.5 w-3.5" />,
  seo: <Search className="h-3.5 w-3.5" />,
  ui: <Eye className="h-3.5 w-3.5" />,
  scoring: <Calculator className="h-3.5 w-3.5" />,
}

interface MultiPhaseScannerProps {
  /** Current phase index (0-based) */
  currentPhase: number
  /** Progress within current phase (0-100) */
  phaseProgress: number
  /** Overall progress across all phases (0-100) */
  overallProgress: number
  /** Custom phases (uses defaults if not provided) */
  phases?: AuditPhase[]
}

// Default phases if none provided
const DEFAULT_PHASES: AuditPhase[] = [
  {
    id: "domain",
    name: "Domain Discovery",
    description: "Analyzing domain & web presence",
    icon: <Globe className="h-5 w-5" />,
    color: "accent",
    items: ["whois-lookup.ts", "dns-records.json", "ssl-certificate.ts", "domain-history.tsx", "web-archive.ts", "social-profiles.json"],
  },
  {
    id: "performance",
    name: "Performance Audit",
    description: "Evaluating speed & DOM structure",
    icon: <Zap className="h-5 w-5" />,
    color: "warning",
    items: ["lighthouse-core.ts", "pagespeed-api.json", "dom-analysis.tsx", "resource-timing.ts", "core-web-vitals.ts", "network-waterfall.json", "render-blocking.ts", "image-optimization.tsx"],
  },
  {
    id: "seo",
    name: "SEO Analysis",
    description: "Scanning search optimization metrics",
    icon: <Search className="h-5 w-5" />,
    color: "accent",
    items: ["meta-tags.ts", "schema-markup.json", "sitemap-parser.tsx", "robots-txt.ts", "backlink-analysis.ts", "keyword-density.json", "canonical-urls.ts", "heading-structure.tsx", "alt-text-audit.ts"],
  },
  {
    id: "ui",
    name: "UI Evaluation",
    description: "Assessing visual design & UX patterns",
    icon: <Eye className="h-5 w-5" />,
    color: "destructive",
    items: ["mobile-responsive.ts", "accessibility-a11y.json", "color-contrast.tsx", "touch-targets.ts", "visual-hierarchy.ts", "booking-flow.json", "trust-signals.tsx", "cta-placement.ts"],
  },
  {
    id: "scoring",
    name: "Calculating Scores",
    description: "Computing final audit results",
    icon: <Calculator className="h-5 w-5" />,
    color: "accent",
    items: ["performance-score.ts", "seo-score.ts", "mobile-score.ts", "accessibility-score.ts", "security-score.ts", "trust-signals-score.ts", "conversion-score.ts", "content-quality-score.ts", "technical-health-score.ts", "user-experience-score.ts", "benchmark-compare.ts", "overall-weighted-score.ts"],
  },
]

export function MultiPhaseScanner({
  currentPhase,
  phaseProgress,
  overallProgress,
  phases = DEFAULT_PHASES,
}: MultiPhaseScannerProps) {
  const phase = phases[currentPhase] || phases[0]

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress Track */}
      <div className="mb-8 px-6">
        <div className="relative">
          {/* Background track line */}
          <div className="absolute top-3 left-3 right-3 h-px bg-border" />

          {/* Filled track line - grows with progress */}
          <div
            className="absolute top-3 left-3 h-px bg-accent transition-all duration-300 ease-out"
            style={{
              width: phases.length > 1
                ? `calc(${(currentPhase / (phases.length - 1)) * 100}% - 24px)`
                : '0%'
            }}
          />

          {/* Phase indicators - equidistant */}
          <div className="relative flex justify-between">
            {phases.map((p, i) => {
              const isComplete = i < currentPhase
              const isCurrent = i === currentPhase

              return (
                <div key={p.id} className="flex flex-col items-center">
                  {/* Circle */}
                  <div className={`
                    relative w-6 h-6 rounded-full flex items-center justify-center
                    transition-all duration-300 ease-out z-10
                    ${isComplete
                      ? "bg-accent text-white"
                      : isCurrent
                        ? "bg-accent text-white ring-4 ring-accent/20"
                        : "bg-card text-muted-foreground border border-border"
                    }
                  `}>
                    {isComplete ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      PHASE_ICONS[p.id] || <span className="text-[10px] font-medium">{i + 1}</span>
                    )}
                    {isCurrent && (
                      <div className="absolute inset-0 rounded-full bg-accent animate-ping opacity-30" />
                    )}
                  </div>

                  {/* Label - centered below */}
                  <span className={`
                    mt-2 text-[10px] font-medium text-center whitespace-nowrap transition-all duration-300
                    ${isCurrent ? "text-foreground" : isComplete ? "text-accent" : "text-muted-foreground"}
                  `}>
                    {p.name.split(' ')[0]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main scanner container */}
      <div className="relative overflow-hidden rounded-2xl bg-card/90 backdrop-blur-xl border border-border shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive/80" />
                <div className="w-3 h-3 rounded-full bg-warning/80" />
                <div className="w-3 h-3 rounded-full bg-accent/80" />
              </div>
              <span className="text-sm font-medium text-foreground">{phase.name}</span>
            </div>
            <div className="text-xs font-mono text-muted-foreground">
              Phase {currentPhase + 1}/{phases.length}
            </div>
          </div>

          {/* Phase-specific animation */}
          <PhaseAnimation phase={phase} progress={phaseProgress} />

          {/* Phase description */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-accent animate-ping" />
              </div>
              <span className="text-sm font-medium text-foreground">{phase.description}</span>
            </div>
            <span className="text-xs font-mono text-muted-foreground">{phaseProgress}%</span>
          </div>

          {/* Phase progress bar */}
          <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-300 ease-out"
              style={{ width: `${phaseProgress}%` }}
            />
          </div>
        </div>

        {/* Overall progress footer */}
        <div className="border-t border-border bg-muted/30 px-6 py-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-mono text-accent font-semibold">{overallProgress}%</span>
          </div>
          <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-500 ease-out"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Phase Animation Router
// ============================================================================

function PhaseAnimation({ phase, progress }: { phase: AuditPhase; progress: number }) {
  switch (phase.id) {
    case "domain":
      return <DomainAnimation phase={phase} progress={progress} />
    case "performance":
      return <PerformanceAnimation phase={phase} progress={progress} />
    case "seo":
      return <SEOAnimation phase={phase} progress={progress} />
    case "ui":
      return <UIAnimation phase={phase} progress={progress} />
    case "scoring":
      return <ScoringAnimation phase={phase} progress={progress} />
    default:
      return <DomainAnimation phase={phase} progress={progress} />
  }
}

// ============================================================================
// Phase 1: Domain Discovery - Directory tree animation
// ============================================================================

function DomainAnimation({ phase, progress }: { phase: AuditPhase; progress: number }) {
  const [visibleItems, setVisibleItems] = useState<number[]>([])
  const [activeItem, setActiveItem] = useState(-1)
  const [pulseItem, setPulseItem] = useState(-1)

  useEffect(() => {
    const count = Math.floor((progress / 100) * phase.items.length)
    setVisibleItems(Array.from({ length: count }, (_, i) => i))
  }, [progress, phase.items.length])

  useEffect(() => {
    if (visibleItems.length === 0) return
    const interval = setInterval(() => {
      setActiveItem((prev) => {
        const next = (prev + 1) % visibleItems.length
        return visibleItems[next]
      })
    }, 600)
    return () => clearInterval(interval)
  }, [visibleItems])

  useEffect(() => {
    if (visibleItems.length > 0) {
      setPulseItem(visibleItems[visibleItems.length - 1])
      const timeout = setTimeout(() => setPulseItem(-1), 400)
      return () => clearTimeout(timeout)
    }
  }, [visibleItems])

  const treeItems = useMemo(() => [
    { name: "whois-lookup", type: "file", indent: 0, icon: "search" },
    { name: "dns-records", type: "file", indent: 0, icon: "dns" },
    { name: "certificates/", type: "folder", indent: 0, icon: "folder" },
    { name: "ssl-cert.pem", type: "file", indent: 1, icon: "lock" },
    { name: "history/", type: "folder", indent: 0, icon: "folder" },
    { name: "archive-data", type: "file", indent: 1, icon: "clock" },
  ], [])

  return (
    <div className="relative h-64 rounded-lg bg-muted/50 overflow-hidden border border-border p-4">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
        <Globe className="h-4 w-4 text-accent" />
        <span className="text-xs font-mono text-muted-foreground">domain-scanner</span>
        <span className="text-xs text-muted-foreground ml-auto font-mono tabular-nums">
          {visibleItems.length}/{phase.items.length} endpoints
        </span>
      </div>

      <div className="space-y-1 font-mono text-sm">
        {treeItems.map((item, i) => {
          const isVisible = visibleItems.includes(i)
          const isActive = activeItem === i
          const isPulsing = pulseItem === i

          return (
            <div
              key={item.name}
              className={`flex items-center gap-2 py-1.5 px-2 rounded-md transition-all duration-300 ${
                !isVisible ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"
              } ${isActive ? "bg-accent text-white shadow-sm" : ""} ${isPulsing ? "bg-accent/30" : ""}`}
              style={{ marginLeft: item.indent * 20, transitionDelay: `${i * 80}ms` }}
            >
              <div className={`w-4 h-4 flex items-center justify-center ${isActive ? "text-white" : "text-muted-foreground"}`}>
                {item.icon === "folder" && <span className="text-xs">+</span>}
                {item.icon === "search" && <span className="text-xs">@</span>}
                {item.icon === "dns" && <span className="text-xs">#</span>}
                {item.icon === "lock" && <span className="text-xs">*</span>}
                {item.icon === "clock" && <span className="text-xs">~</span>}
              </div>
              <span className={`text-xs transition-colors ${
                isActive ? "text-white font-medium" : item.type === "folder" ? "text-accent font-medium" : "text-muted-foreground"
              }`}>
                {item.name}
              </span>
              {isVisible && (
                <div className="ml-auto flex items-center gap-1">
                  {isActive && <span className="text-[10px] text-white/80 animate-pulse">scanning...</span>}
                  {!isActive && i < visibleItems.length - 1 && <span className="text-[10px] text-accent/60">done</span>}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="absolute bottom-4 left-4 right-4">
        <div className="flex items-center gap-1">
          {phase.items.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${visibleItems.includes(i) ? "bg-accent" : "bg-muted"}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
          <span>Endpoints discovered</span>
          <span>{visibleItems.length}/{phase.items.length}</span>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Phase 2: Performance - Waterfall chart animation
// ============================================================================

function PerformanceAnimation({ phase, progress }: { phase: AuditPhase; progress: number }) {
  const barConfig = useMemo(() =>
    phase.items.map((item, i) => {
      const startDelay = i * 8 + (i > 2 ? 5 : 0) + (i > 5 ? 10 : 0)
      const loadDuration = 15 + (i % 3) * 12 + (i % 2) * 8
      const color = i % 3 === 0 ? "bg-accent" : i % 3 === 1 ? "bg-warning" : "bg-muted-foreground/70"
      return { id: item, startDelay, loadDuration, color }
    }), [phase.items]
  )

  const [barWidths, setBarWidths] = useState<number[]>(() => phase.items.map(() => 0))

  useEffect(() => {
    setBarWidths(prev =>
      barConfig.map((bar, i) => {
        const barStart = bar.startDelay
        const barEnd = bar.startDelay + bar.loadDuration
        let targetWidth = 0
        if (progress >= barEnd) targetWidth = 100
        else if (progress > barStart) targetWidth = ((progress - barStart) / bar.loadDuration) * 100
        return Math.max(prev[i], targetWidth)
      })
    )
  }, [progress, barConfig])

  return (
    <div className="relative h-64 rounded-lg bg-muted/50 overflow-hidden border border-border flex flex-col">
      {/* Header row with time markers */}
      <div className="flex items-center px-3 py-2 border-b border-border/50 bg-muted/30">
        <span className="text-[10px] text-muted-foreground font-medium w-24">Resource</span>
        <div className="flex-1 flex justify-between text-[10px] text-muted-foreground font-mono">
          <span>0ms</span>
          <span>250ms</span>
          <span>500ms</span>
        </div>
        <span className="text-[10px] text-muted-foreground w-10 text-right">Time</span>
      </div>

      {/* Waterfall chart body */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {barConfig.map((bar, i) => {
          const width = barWidths[i] || 0
          const startPercent = (bar.startDelay / 100) * 90
          const widthPercent = (width / 100) * (bar.loadDuration / 100) * 90

          return (
            <div key={bar.id} className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-24 truncate font-mono">
                {bar.id.replace(/\.(ts|tsx|json)$/, "")}
              </span>
              <div className="flex-1 h-3 bg-muted/30 rounded overflow-hidden relative">
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map(pos => (
                  <div key={pos} className="absolute top-0 bottom-0 w-px bg-border/40" style={{ left: `${pos}%` }} />
                ))}
                {/* Bar */}
                <div
                  className={`absolute top-0 bottom-0 ${bar.color} rounded transition-all duration-200 ease-out`}
                  style={{ left: `${startPercent}%`, width: `${widthPercent}%` }}
                />
              </div>
              <span className="text-[9px] font-mono text-muted-foreground w-10 text-right tabular-nums">
                {width > 0 ? `${Math.round(bar.startDelay * 5 + (width / 100) * bar.loadDuration * 5)}ms` : "—"}
              </span>
            </div>
          )
        })}
      </div>

      {/* Status footer */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-border/50 bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">analyzing resources...</span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">{barConfig.filter((_, i) => barWidths[i] >= 100).length}/{barConfig.length}</span>
      </div>
    </div>
  )
}

// ============================================================================
// Phase 3: SEO - Metric grid animation
// ============================================================================

function SEOAnimation({ phase, progress }: { phase: AuditPhase; progress: number }) {
  const [activeItems, setActiveItems] = useState<number[]>([])
  const [currentScan, setCurrentScan] = useState(0)

  useEffect(() => {
    const count = Math.floor((progress / 100) * phase.items.length)
    setActiveItems(Array.from({ length: count }, (_, i) => i))
  }, [progress, phase.items.length])

  useEffect(() => {
    if (activeItems.length === 0) return
    const interval = setInterval(() => {
      setCurrentScan((prev) => (prev + 1) % phase.items.length)
    }, 400)
    return () => clearInterval(interval)
  }, [activeItems.length, phase.items.length])

  const seoMetrics = useMemo(() => [
    { name: "Meta Tags", category: "On-Page" },
    { name: "Schema Markup", category: "On-Page" },
    { name: "Sitemap", category: "Technical" },
    { name: "Robots.txt", category: "Technical" },
    { name: "Backlinks", category: "Off-Page" },
    { name: "Keywords", category: "Content" },
    { name: "Canonicals", category: "Technical" },
    { name: "Headings", category: "Content" },
    { name: "Alt Text", category: "Content" },
  ], [])

  const categories = ["On-Page", "Technical", "Content", "Off-Page"]

  return (
    <div className="relative h-64 rounded-lg bg-muted/50 overflow-hidden border border-border p-4">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
        <Search className="h-4 w-4 text-accent" />
        <span className="text-xs font-mono text-muted-foreground">seo-analyzer</span>
        <span className="text-xs text-muted-foreground ml-auto">{activeItems.length}/{phase.items.length} checks</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {seoMetrics.map((metric, i) => {
          const isActive = activeItems.includes(i)
          const isScanning = currentScan === i && !isActive
          const category = categories.indexOf(metric.category)

          return (
            <div
              key={metric.name}
              className={`relative px-2 py-2 rounded-md border transition-all duration-300 ${
                isScanning
                  ? "bg-accent text-white border-accent shadow-sm"
                  : isActive
                    ? "bg-accent/15 border-accent/40 text-accent"
                    : "bg-muted/20 border-border/30 text-muted-foreground/60"
              }`}
              style={{ transitionDelay: `${i * 30}ms` }}
            >
              <div className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full transition-colors ${
                isScanning
                  ? "bg-white"
                  : isActive
                    ? category === 0 ? "bg-accent" : category === 1 ? "bg-warning" : category === 2 ? "bg-chart-2" : "bg-chart-3"
                    : "bg-muted"
              }`} />
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-medium truncate ${isScanning ? "text-white" : ""}`}>{metric.name}</span>
              </div>
              <div className="mt-1 flex items-center gap-1">
                {isScanning && <span className="text-[8px] text-white/80 animate-pulse">scanning...</span>}
                {isActive && !isScanning && <span className="text-[8px] text-accent">complete</span>}
                {!isActive && !isScanning && <span className="text-[8px] text-muted-foreground/40">pending</span>}
              </div>
            </div>
          )
        })}
      </div>

      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
        <div className="flex gap-3 text-[9px] text-muted-foreground">
          <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-accent" /> On-Page</span>
          <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-warning" /> Technical</span>
          <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-chart-2" /> Content</span>
          <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-chart-3" /> Off-Page</span>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Phase 4: UI Evaluation - Device scanning animation
// ============================================================================

function UIAnimation({ phase, progress }: { phase: AuditPhase; progress: number }) {
  const [scanProgress, setScanProgress] = useState({ desktop: 0, mobile: 0 })
  const [highlights, setHighlights] = useState<{ x: number; y: number; type: string }[]>([])

  useEffect(() => {
    setScanProgress({
      desktop: Math.min(100, progress * 1.2),
      mobile: Math.min(100, progress * 0.9),
    })
  }, [progress])

  useEffect(() => {
    if (progress > 20 && highlights.length < 6) {
      const interval = setInterval(() => {
        setHighlights((prev) => {
          if (prev.length >= 6) return prev
          const types = ["warning", "accent", "destructive"]
          return [...prev, {
            x: 20 + Math.random() * 60,
            y: 20 + Math.random() * 60,
            type: types[Math.floor(Math.random() * types.length)],
          }]
        })
      }, 800)
      return () => clearInterval(interval)
    }
  }, [progress, highlights])

  return (
    <div className="relative h-64 rounded-lg bg-muted/50 overflow-hidden border border-border p-4">
      {/* Devices - bottom aligned */}
      <div className="flex items-end justify-center gap-8 h-48">
        {/* Desktop */}
        <div className="flex flex-col items-center">
          <div className="relative w-48 h-32 rounded-lg border-2 border-border bg-card overflow-hidden">
            <div className="h-4 bg-muted border-b border-border flex items-center px-2 gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-destructive/60" />
              <div className="w-1.5 h-1.5 rounded-full bg-warning/60" />
              <div className="w-1.5 h-1.5 rounded-full bg-accent/60" />
            </div>
            <div className="relative h-full">
              <div className="p-2 space-y-1">
                <div className="h-2 w-16 bg-muted rounded" />
                <div className="h-1 w-24 bg-muted/50 rounded" />
                <div className="h-1 w-20 bg-muted/50 rounded" />
                <div className="h-6 w-full bg-muted/30 rounded mt-2" />
              </div>
              <div
                className="absolute left-0 right-0 h-1 bg-gradient-to-b from-accent to-transparent"
                style={{ top: `${scanProgress.desktop}%`, transition: "top 0.1s linear" }}
              />
              {highlights.slice(0, 3).map((h, i) => (
                <div
                  key={i}
                  className={`absolute w-3 h-3 rounded-full border-2 ${
                    h.type === "warning" ? "border-warning bg-warning/20" :
                    h.type === "destructive" ? "border-destructive bg-destructive/20" :
                    "border-accent bg-accent/20"
                  }`}
                  style={{ left: `${h.x}%`, top: `${h.y}%` }}
                />
              ))}
            </div>
          </div>
          <div className="mt-2 text-center">
            <div className="text-[10px] font-medium text-muted-foreground">Desktop</div>
            <div className="text-[9px] text-muted-foreground/60 font-mono">1440 × 900</div>
          </div>
        </div>

        {/* Mobile */}
        <div className="flex flex-col items-center">
          <div className="relative w-20 h-40 rounded-xl border-2 border-border bg-card overflow-hidden">
            <div className="h-3 bg-muted border-b border-border flex items-center justify-center">
              <div className="w-6 h-1 rounded-full bg-border" />
            </div>
            <div className="relative h-full">
              <div className="p-1.5 space-y-1">
                <div className="h-1.5 w-10 bg-muted rounded" />
                <div className="h-1 w-12 bg-muted/50 rounded" />
                <div className="h-4 w-full bg-muted/30 rounded mt-1" />
                <div className="h-1 w-8 bg-muted/50 rounded" />
              </div>
              <div
                className="absolute left-0 right-0 h-1 bg-gradient-to-b from-accent to-transparent"
                style={{ top: `${scanProgress.mobile}%`, transition: "top 0.1s linear" }}
              />
              {highlights.slice(3, 6).map((h, i) => (
                <div
                  key={i}
                  className={`absolute w-2 h-2 rounded-full border ${
                    h.type === "warning" ? "border-warning bg-warning/20" :
                    h.type === "destructive" ? "border-destructive bg-destructive/20" :
                    "border-accent bg-accent/20"
                  }`}
                  style={{ left: `${h.x}%`, top: `${h.y}%` }}
                />
              ))}
            </div>
          </div>
          <div className="mt-2 text-center">
            <div className="text-[10px] font-medium text-muted-foreground">Mobile</div>
            <div className="text-[9px] text-muted-foreground/60 font-mono">iPhone 16 Pro</div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
        <div className="flex gap-3 text-[9px] text-muted-foreground">
          <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-accent" /> Pass</span>
          <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-warning" /> Warning</span>
          <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-destructive" /> Issue</span>
        </div>
        <span className="text-[9px] font-mono text-muted-foreground">{highlights.length}/6 checks</span>
      </div>
    </div>
  )
}

// ============================================================================
// Phase 5: Scoring - Animated score counters
// ============================================================================

function ScoringAnimation({ phase, progress }: { phase: AuditPhase; progress: number }) {
  const scoreRubrics = useMemo(() => [
    { id: "performance", label: "Performance", target: 72, weight: 15 },
    { id: "seo", label: "SEO", target: 85, weight: 15 },
    { id: "mobile", label: "Mobile", target: 78, weight: 12 },
    { id: "accessibility", label: "Accessibility", target: 64, weight: 10 },
    { id: "security", label: "Security", target: 92, weight: 12 },
    { id: "trust", label: "Trust Signals", target: 88, weight: 10 },
    { id: "conversion", label: "Conversion", target: 56, weight: 8 },
    { id: "content", label: "Content Quality", target: 81, weight: 8 },
    { id: "technical", label: "Technical Health", target: 74, weight: 5 },
    { id: "ux", label: "User Experience", target: 69, weight: 5 },
  ], [])

  const [scores, setScores] = useState<Record<string, number>>(() =>
    Object.fromEntries(scoreRubrics.map(r => [r.id, 0]))
  )
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const newScores: Record<string, number> = {}
    scoreRubrics.forEach((rubric, i) => {
      const rubricStart = (i / scoreRubrics.length) * 70
      const rubricEnd = rubricStart + 25
      if (progress >= rubricEnd) newScores[rubric.id] = rubric.target
      else if (progress > rubricStart) {
        const rubricProgress = (progress - rubricStart) / (rubricEnd - rubricStart)
        newScores[rubric.id] = Math.floor(rubric.target * rubricProgress)
      } else newScores[rubric.id] = 0
    })
    setScores(newScores)
  }, [progress, scoreRubrics])

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % scoreRubrics.length)
    }, 300)
    return () => clearInterval(interval)
  }, [scoreRubrics.length])

  const overallScore = useMemo(() => {
    let weighted = 0, totalWeight = 0
    scoreRubrics.forEach((rubric) => {
      weighted += (scores[rubric.id] || 0) * rubric.weight
      totalWeight += rubric.weight
    })
    return Math.round(weighted / totalWeight)
  }, [scores, scoreRubrics])

  const getScoreColor = (score: number) => score >= 80 ? "text-accent" : score >= 60 ? "text-warning" : "text-destructive"
  const getBarColor = (score: number) => score >= 80 ? "bg-accent" : score >= 60 ? "bg-warning" : "bg-destructive"

  return (
    <div className="relative h-64 rounded-lg bg-background/50 overflow-hidden border border-border/50 p-3">
      <div className="flex gap-3 h-full">
        <div className="flex-1 overflow-hidden">
          <div className="text-[10px] text-muted-foreground mb-2 flex justify-between">
            <span>Rubric</span>
            <span>Score</span>
          </div>
          <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
            {scoreRubrics.map((rubric, i) => {
              const score = scores[rubric.id] || 0
              const isActive = activeIndex === i
              const isComplete = score === rubric.target

              return (
                <div key={rubric.id} className={`flex items-center gap-2 py-1.5 px-2 rounded-md transition-all ${
                  isActive && !isComplete ? "bg-accent text-white shadow-sm" : ""
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    isActive && !isComplete ? "bg-white" : isComplete ? getBarColor(score) : "bg-muted"
                  }`} />
                  <span className={`text-[10px] w-20 truncate ${
                    isActive && !isComplete ? "text-white font-medium" : isComplete ? "text-foreground" : "text-muted-foreground"
                  }`}>{rubric.label}</span>
                  <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isActive && !isComplete ? "bg-white/30" : "bg-muted/50"}`}>
                    <div className={`h-full rounded-full transition-all duration-300 ${isActive && !isComplete ? "bg-white" : getBarColor(score)}`} style={{ width: `${score}%` }} />
                  </div>
                  <span className={`text-[10px] font-mono font-medium w-6 text-right tabular-nums ${
                    isActive && !isComplete ? "text-white" : score > 0 ? getScoreColor(score) : "text-muted-foreground/40"
                  }`}>
                    {score > 0 ? score : "—"}
                  </span>
                  <span className={`text-[8px] w-6 text-right ${isActive && !isComplete ? "text-white/70" : "text-muted-foreground/50"}`}>{rubric.weight}%</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="w-28 flex flex-col items-center justify-center border-l border-border/50 pl-3">
          <svg viewBox="0 0 100 100" className="w-20 h-20">
            <defs>
              <filter id="score-glow-scanner">
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <circle cx="50" cy="50" r="40" fill="none" stroke="var(--color-muted)" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="40" fill="none"
              stroke={overallScore >= 80 ? "var(--color-accent)" : overallScore >= 60 ? "var(--color-warning)" : "var(--color-destructive)"}
              strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - overallScore / 100)}`}
              transform="rotate(-90 50 50)"
              filter="url(#score-glow-scanner)"
              style={{ transition: "stroke-dashoffset 0.3s ease" }}
            />
            <text x="50" y="46" textAnchor="middle" className="fill-foreground font-bold" style={{ fontSize: "22px" }}>{overallScore}</text>
            <text x="50" y="62" textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: "8px" }}>OVERALL</text>
          </svg>
          <span className="text-[9px] text-muted-foreground mt-1">Weighted Score</span>
          {progress < 100 && (
            <div className="flex items-center gap-1 mt-2">
              <div className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-1 h-1 rounded-full bg-accent animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
