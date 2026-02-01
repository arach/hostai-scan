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
  /** Domain being scanned */
  domain?: string
}

// Default phases if none provided
const DEFAULT_PHASES: AuditPhase[] = [
  {
    id: "domain",
    name: "Domain Discovery",
    description: "Resolving DNS, certificates & web presence",
    icon: <Globe className="h-5 w-5" />,
    color: "accent",
    items: ["whois-lookup.ts", "dns-records.json", "ssl-certificate.ts", "domain-history.tsx", "web-archive.ts", "social-profiles.json"],
  },
  {
    id: "performance",
    name: "Performance Audit",
    description: "Measuring speed & core web vitals",
    icon: <Zap className="h-5 w-5" />,
    color: "warning",
    items: ["lighthouse-core.ts", "pagespeed-api.json", "dom-analysis.tsx", "resource-timing.ts", "core-web-vitals.ts", "network-waterfall.json", "render-blocking.ts", "image-optimization.tsx"],
  },
  {
    id: "seo",
    name: "SEO Analysis",
    description: "Checking meta tags, schema & backlinks",
    icon: <Search className="h-5 w-5" />,
    color: "accent",
    items: ["meta-tags.ts", "schema-markup.json", "sitemap-parser.tsx", "robots-txt.ts", "backlink-analysis.ts", "keyword-density.json", "canonical-urls.ts", "heading-structure.tsx", "alt-text-audit.ts"],
  },
  {
    id: "ui",
    name: "UI Evaluation",
    description: "Inspecting responsive design & UX patterns",
    icon: <Eye className="h-5 w-5" />,
    color: "destructive",
    items: ["mobile-responsive.ts", "accessibility-a11y.json", "color-contrast.tsx", "touch-targets.ts", "visual-hierarchy.ts", "booking-flow.json", "trust-signals.tsx", "cta-placement.ts"],
  },
  {
    id: "scoring",
    name: "Calculating Scores",
    description: "Computing weighted audit results",
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
  domain,
}: MultiPhaseScannerProps) {
  const phase = phases[currentPhase] || phases[0]

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Domain label - scanning text + gradient domain */}
      {domain && (
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="text-xl text-muted-foreground">Scanning</span>
          <span className="text-xl font-semibold bg-gradient-to-r from-violet-500 to-indigo-400 bg-clip-text text-transparent">
            {domain}
          </span>
        </div>
      )}

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

      {/* Main scanner container - just the phase animation with its own header/footer */}
      <div className="relative overflow-hidden rounded-2xl bg-card/90 backdrop-blur-xl border border-border shadow-2xl">
        <PhaseAnimation phase={phase} progress={phaseProgress} />
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
  const treeItems = useMemo(() => [
    { name: "whois-lookup", type: "file", indent: 0, icon: "@" },
    { name: "dns-records", type: "file", indent: 0, icon: "#" },
    { name: "certificates/", type: "folder", indent: 0, icon: "+" },
    { name: "ssl-cert.pem", type: "file", indent: 1, icon: "*" },
    { name: "history/", type: "folder", indent: 0, icon: "+" },
    { name: "archive-data", type: "file", indent: 1, icon: "~" },
  ], [])

  const completedCount = Math.floor((progress / 100) * treeItems.length)
  const currentIndex = Math.min(completedCount, treeItems.length - 1)
  const isAllComplete = progress >= 95

  return (
    <div className="flex flex-col h-80">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-muted/30">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-accent/60" />
        </div>
        <Globe className="h-3.5 w-3.5 text-muted-foreground ml-2" />
        <span className="text-xs font-mono text-muted-foreground">domain-scanner</span>
      </div>

      {/* Body - all items visible from start, pending shown as placeholders */}
      <div className="flex-1 min-h-0 overflow-hidden px-4 py-4">
        <div className="space-y-1 font-mono">
          {treeItems.map((item, i) => {
            const isComplete = isAllComplete || i < completedCount
            const isCurrent = !isAllComplete && i === currentIndex
            const isPending = !isAllComplete && i > currentIndex

            return (
              <div
                key={item.name}
                className={`flex items-center gap-2 h-7 px-2 rounded transition-all duration-300 ${
                  isCurrent ? "bg-accent text-white" : ""
                }`}
                style={{ marginLeft: item.indent * 16 }}
              >
                {/* Icon - always visible */}
                <div className={`w-3 h-3 flex items-center justify-center text-[10px] transition-colors duration-300 ${
                  isCurrent ? "text-white" : isComplete ? "text-accent" : "text-muted-foreground/30"
                }`}>
                  {item.icon}
                </div>

                {/* Name or placeholder - fixed width container */}
                <div className="flex-1 min-w-0">
                  {isPending ? (
                    <div className="h-3 rounded bg-muted/40" style={{ width: `${60 + (i % 3) * 20}px` }} />
                  ) : (
                    <span className={`text-[11px] transition-colors duration-300 ${
                      isCurrent ? "text-white font-medium"
                        : isComplete ? (item.type === "folder" ? "text-accent" : "text-foreground")
                        : "text-muted-foreground/40"
                    }`}>
                      {item.name}
                    </span>
                  )}
                </div>

                {/* Status - fixed width */}
                <div className="w-16 text-right">
                  {isCurrent && <span className="text-[9px] text-white/80 animate-pulse">scanning...</span>}
                  {isComplete && <span className="text-[9px] text-accent">✓</span>}
                  {isPending && <div className="h-2 w-6 rounded bg-muted/30 ml-auto" />}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
          </div>
          <span className="text-xs text-muted-foreground">{phase.description}</span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
          {completedCount}/{treeItems.length}
        </span>
      </div>
    </div>
  )
}

// ============================================================================
// Phase 2: Performance - Waterfall chart animation
// ============================================================================

function PerformanceAnimation({ phase, progress }: { phase: AuditPhase; progress: number }) {
  // Cap at 8 items for cleaner display
  const barConfig = useMemo(() =>
    phase.items.slice(0, 8).map((item, i) => {
      const startDelay = i * 10 + (i > 3 ? 5 : 0)
      const loadDuration = 15 + (i % 3) * 12 + (i % 2) * 8
      const color = i % 3 === 0 ? "bg-accent" : i % 3 === 1 ? "bg-warning" : "bg-muted-foreground/70"
      return { id: item, startDelay, loadDuration, color }
    }), [phase.items]
  )

  const [barWidths, setBarWidths] = useState<number[]>(() => barConfig.map(() => 0))

  useEffect(() => {
    setBarWidths(prev =>
      barConfig.map((bar, i) => {
        const barStart = bar.startDelay
        const barEnd = bar.startDelay + bar.loadDuration
        let targetWidth = 0
        if (progress >= barEnd) targetWidth = 100
        else if (progress > barStart) targetWidth = ((progress - barStart) / bar.loadDuration) * 100
        return Math.max(prev[i] ?? 0, targetWidth)
      })
    )
  }, [progress, barConfig])

  const completedCount = barConfig.filter((_, i) => (barWidths[i] ?? 0) >= 100).length

  return (
    <div className="flex flex-col h-80">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-muted/30">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-accent/60" />
        </div>
        <Zap className="h-3.5 w-3.5 text-muted-foreground ml-2" />
        <span className="text-xs font-mono text-muted-foreground">performance-audit</span>
        <div className="flex-1 flex justify-end gap-6 text-[10px] text-muted-foreground font-mono">
          <span>0ms</span>
          <span>250ms</span>
          <span>500ms</span>
        </div>
      </div>

      {/* Body - waterfall chart with more breathing room */}
      <div className="flex-1 flex flex-col justify-center px-4 py-3 space-y-2">
        {barConfig.map((bar, i) => {
          const width = barWidths[i] ?? 0
          const startPercent = (bar.startDelay / 100) * 90
          const widthPercent = (width / 100) * (bar.loadDuration / 100) * 90

          return (
            <div key={bar.id} className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground w-28 truncate font-mono">
                {bar.id.replace(/\.(ts|tsx|json)$/, "")}
              </span>
              <div className="flex-1 h-3.5 bg-muted/30 rounded overflow-hidden relative">
                {[0, 25, 50, 75, 100].map(pos => (
                  <div key={pos} className="absolute top-0 bottom-0 w-px bg-border/30" style={{ left: `${pos}%` }} />
                ))}
                <div
                  className={`absolute top-0 bottom-0 ${bar.color} rounded transition-all duration-200 ease-out`}
                  style={{ left: `${startPercent}%`, width: `${widthPercent}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground w-12 text-right tabular-nums">
                {width > 0 ? `${Math.round(bar.startDelay * 5 + (width / 100) * bar.loadDuration * 5)}ms` : "—"}
              </span>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
          </div>
          <span className="text-xs text-muted-foreground">{phase.description}</span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
          {completedCount}/{barConfig.length}
        </span>
      </div>
    </div>
  )
}

// ============================================================================
// Phase 3: SEO - Metric grid animation
// ============================================================================

function SEOAnimation({ phase, progress }: { phase: AuditPhase; progress: number }) {
  const seoMetrics = useMemo(() => [
    { name: "Meta Tags", result: "pass" },
    { name: "Schema", result: "warning" },
    { name: "Sitemap", result: "pass" },
    { name: "Robots.txt", result: "pass" },
    { name: "Backlinks", result: "pass" },
    { name: "Keywords", result: "warning" },
    { name: "Canonicals", result: "pass" },
    { name: "Headings", result: "issue" },
    { name: "Alt Text", result: "warning" },
  ] as const, [])

  const completedCount = Math.floor((progress / 100) * seoMetrics.length)
  const currentIndex = Math.min(completedCount, seoMetrics.length - 1)
  const isAllComplete = progress >= 95

  return (
    <div className="flex flex-col h-80">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-muted/30">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-accent/60" />
        </div>
        <Search className="h-3.5 w-3.5 text-muted-foreground ml-2" />
        <span className="text-xs font-mono text-muted-foreground">seo-analyzer</span>
      </div>

      {/* Body - metrics grid, symmetrical cards */}
      <div className="flex-1 min-h-0 flex items-center p-4">
        <div className="grid grid-cols-3 gap-2 w-full">
          {seoMetrics.map((metric, i) => {
            const isComplete = isAllComplete || i < completedCount
            const isScanning = !isAllComplete && i === currentIndex
            const isPending = !isAllComplete && i > currentIndex

            const resultColor = metric.result === "pass" ? "text-accent"
              : metric.result === "warning" ? "text-warning"
              : "text-destructive"
            const resultBg = metric.result === "pass" ? "bg-accent/10"
              : metric.result === "warning" ? "bg-warning/10"
              : "bg-destructive/10"
            const resultIcon = metric.result === "pass" ? "✓"
              : metric.result === "warning" ? "!"
              : "×"

            return (
              <div
                key={metric.name}
                className={`flex items-center justify-between h-10 px-2.5 rounded border transition-all duration-200 ${
                  isScanning
                    ? "bg-accent text-white border-accent"
                    : isComplete
                      ? `${resultBg} border-border/50`
                      : "bg-muted/10 border-border/20"
                }`}
              >
                {/* Name */}
                <span className={`text-[11px] font-medium ${
                  isScanning ? "text-white" : isComplete ? resultColor : "text-muted-foreground/30"
                }`}>
                  {metric.name}
                </span>

                {/* Status icon - inline, not absolute */}
                <div className="w-4 flex items-center justify-center">
                  {isScanning && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                  {isComplete && (
                    <span className={`text-[10px] font-bold ${resultColor}`}>{resultIcon}</span>
                  )}
                  {isPending && (
                    <span className="text-[10px] text-muted-foreground/20">·</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
          </div>
          <span className="text-xs text-muted-foreground">{phase.description}</span>
        </div>
        <div className="flex gap-3 text-[9px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="text-accent font-bold">✓</span> Pass</span>
          <span className="flex items-center gap-1"><span className="text-warning font-bold">!</span> Warn</span>
          <span className="flex items-center gap-1"><span className="text-destructive font-bold">×</span> Issue</span>
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

  const checksComplete = Math.floor(progress / 100 * 8)

  return (
    <div className="flex flex-col h-80">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-muted/30">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-accent/60" />
        </div>
        <Eye className="h-3.5 w-3.5 text-muted-foreground ml-2" />
        <span className="text-xs font-mono text-muted-foreground">ui-evaluator</span>
      </div>

      {/* Body - device previews */}
      <div className="flex-1 flex items-end justify-center gap-8 p-4 pb-2">
        {/* Desktop */}
        <div className="flex flex-col items-center">
          <div className="relative w-44 h-28 rounded-lg border-2 border-border bg-card overflow-hidden">
            <div className="h-3 bg-muted border-b border-border flex items-center px-1.5 gap-0.5">
              <div className="w-1 h-1 rounded-full bg-destructive/60" />
              <div className="w-1 h-1 rounded-full bg-warning/60" />
              <div className="w-1 h-1 rounded-full bg-accent/60" />
            </div>
            <div className="relative h-full">
              <div className="p-1.5 space-y-0.5">
                <div className="h-1.5 w-12 bg-muted rounded" />
                <div className="h-0.5 w-20 bg-muted/50 rounded" />
                <div className="h-5 w-full bg-muted/30 rounded mt-1" />
              </div>
              <div
                className="absolute left-0 right-0 h-0.5 bg-gradient-to-b from-accent to-transparent"
                style={{ top: `${scanProgress.desktop}%`, transition: "top 0.1s linear" }}
              />
              {highlights.slice(0, 3).map((h, i) => (
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
          <div className="mt-1.5 text-center">
            <div className="text-[9px] text-muted-foreground font-mono">1440 × 900</div>
          </div>
        </div>

        {/* Mobile */}
        <div className="flex flex-col items-center">
          <div className="relative w-16 h-32 rounded-xl border-2 border-border bg-card overflow-hidden">
            <div className="h-2 bg-muted border-b border-border flex items-center justify-center">
              <div className="w-4 h-0.5 rounded-full bg-border" />
            </div>
            <div className="relative h-full">
              <div className="p-1 space-y-0.5">
                <div className="h-1 w-8 bg-muted rounded" />
                <div className="h-0.5 w-10 bg-muted/50 rounded" />
                <div className="h-3 w-full bg-muted/30 rounded mt-0.5" />
              </div>
              <div
                className="absolute left-0 right-0 h-0.5 bg-gradient-to-b from-accent to-transparent"
                style={{ top: `${scanProgress.mobile}%`, transition: "top 0.1s linear" }}
              />
              {highlights.slice(3, 6).map((h, i) => (
                <div
                  key={i}
                  className={`absolute w-1.5 h-1.5 rounded-full border ${
                    h.type === "warning" ? "border-warning bg-warning/20" :
                    h.type === "destructive" ? "border-destructive bg-destructive/20" :
                    "border-accent bg-accent/20"
                  }`}
                  style={{ left: `${h.x}%`, top: `${h.y}%` }}
                />
              ))}
            </div>
          </div>
          <div className="mt-1.5 text-center">
            <div className="text-[9px] text-muted-foreground font-mono">iPhone 16</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
          </div>
          <span className="text-xs text-muted-foreground">{phase.description}</span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
          {checksComplete}/8
        </span>
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

  const completedCount = Math.floor((progress / 100) * scoreRubrics.length)
  const isAllComplete = progress >= 95

  const scores = useMemo(() => {
    const result: Record<string, number> = {}
    scoreRubrics.forEach((rubric, i) => {
      if (isAllComplete || i < completedCount) {
        result[rubric.id] = rubric.target
      } else if (i === completedCount) {
        const itemProgress = (progress / 100 * scoreRubrics.length) - completedCount
        result[rubric.id] = Math.floor(rubric.target * itemProgress)
      } else {
        result[rubric.id] = 0
      }
    })
    return result
  }, [progress, scoreRubrics, completedCount, isAllComplete])

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
    <div className="flex flex-col h-80">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-muted/30">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-accent/60" />
        </div>
        <Calculator className="h-3.5 w-3.5 text-muted-foreground ml-2" />
        <span className="text-xs font-mono text-muted-foreground">score-calculator</span>
      </div>

      {/* Body - scores + gauge */}
      <div className="flex-1 flex gap-3 p-3 overflow-hidden">
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="space-y-1">
            {scoreRubrics.map((rubric, i) => {
              const score = scores[rubric.id] || 0
              const isComplete = isAllComplete || i < completedCount
              const isCurrent = !isAllComplete && i === completedCount

              return (
                <div key={rubric.id} className={`flex items-center gap-2 py-1 px-2 rounded-md transition-all duration-300 ${
                  isCurrent ? "bg-accent text-white" : ""
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    isCurrent ? "bg-white" : isComplete ? getBarColor(score) : "bg-muted"
                  }`} />
                  <span className={`text-[10px] w-20 truncate ${
                    isCurrent ? "text-white font-medium" : isComplete ? "text-foreground" : "text-muted-foreground/40"
                  }`}>{rubric.label}</span>
                  <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${
                    isCurrent ? "bg-white/30" : "bg-muted/50"
                  }`}>
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isCurrent ? "bg-white" : score > 0 ? getBarColor(score) : "bg-transparent"
                      }`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  <span className={`text-[10px] font-mono font-medium w-6 text-right tabular-nums ${
                    isCurrent ? "text-white" : score > 0 ? getScoreColor(score) : "text-muted-foreground/30"
                  }`}>
                    {score > 0 ? score : "—"}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="w-24 flex flex-col items-center justify-center border-l border-border/50 pl-3">
          <svg viewBox="0 0 100 100" className="w-16 h-16">
            <circle cx="50" cy="50" r="40" fill="none" stroke="var(--color-muted)" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="40" fill="none"
              stroke={overallScore >= 80 ? "var(--color-accent)" : overallScore >= 60 ? "var(--color-warning)" : "var(--color-destructive)"}
              strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - overallScore / 100)}`}
              transform="rotate(-90 50 50)"
              style={{ transition: "stroke-dashoffset 0.3s ease" }}
            />
            <text x="50" y="54" textAnchor="middle" className="fill-foreground font-bold" style={{ fontSize: "20px" }}>{overallScore}</text>
          </svg>
          <span className="text-[9px] text-muted-foreground mt-1">Overall</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
          </div>
          <span className="text-xs text-muted-foreground">{phase.description}</span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
          {completedCount}/{scoreRubrics.length}
        </span>
      </div>
    </div>
  )
}
