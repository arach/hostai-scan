import React from "react"

import { useEffect, useState, useMemo } from "react"
import { Globe, Zap, Search, Eye, Calculator } from "lucide-react"

export interface AuditPhase {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  color: string
  items: string[]
}

export const AUDIT_PHASES: AuditPhase[] = [
  {
    id: "domain",
    name: "Domain Discovery",
    description: "Analyzing domain & web presence",
    icon: <Globe className="h-5 w-5" />,
    color: "accent",
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
    description: "Evaluating speed & DOM structure",
    icon: <Zap className="h-5 w-5" />,
    color: "warning",
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
    name: "UI Evaluation",
    description: "Assessing visual design & UX patterns",
    icon: <Eye className="h-5 w-5" />,
    color: "destructive",
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
    items: [
      "performance-score.ts",
      "seo-score.ts",
      "mobile-score.ts",
      "accessibility-score.ts",
      "security-score.ts",
      "trust-signals-score.ts",
      "conversion-score.ts",
      "content-quality-score.ts",
      "technical-health-score.ts",
      "user-experience-score.ts",
      "benchmark-compare.ts",
      "overall-weighted-score.ts",
    ],
  },
]

interface MultiPhaseScannerProps {
  currentPhase: number
  phaseProgress: number
  overallProgress: number
}

export function MultiPhaseScanner({
  currentPhase,
  phaseProgress,
  overallProgress,
}: MultiPhaseScannerProps) {
  const phase = AUDIT_PHASES[currentPhase] || AUDIT_PHASES[0]

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Phase indicator pills */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {AUDIT_PHASES.map((p, i) => (
          <div
            key={p.id}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-500 ${
              i === currentPhase
                ? "bg-foreground text-background scale-110"
                : i < currentPhase
                  ? "bg-accent/20 text-accent"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {p.icon}
            <span className="hidden sm:inline">{p.name}</span>
          </div>
        ))}
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
              Phase {currentPhase + 1}/{AUDIT_PHASES.length}
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
            <span className="font-mono text-foreground">{overallProgress}%</span>
          </div>
          <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-foreground rounded-full transition-all duration-500 ease-out"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Phase-specific animation component
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

// Phase 1: Domain Discovery - Directory tree with expanding links
function DomainAnimation({ phase, progress }: { phase: AuditPhase; progress: number }) {
  const [visibleItems, setVisibleItems] = useState<number[]>([])
  const [activeItem, setActiveItem] = useState(-1)
  const [pulseItem, setPulseItem] = useState(-1)

  // Items reveal based on progress
  useEffect(() => {
    const count = Math.floor((progress / 100) * phase.items.length)
    setVisibleItems(Array.from({ length: count }, (_, i) => i))
  }, [progress, phase.items.length])

  // Cycling active item animation
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

  // Pulse effect on newly revealed items
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
    <div className="relative h-64 rounded-lg bg-background/50 overflow-hidden border border-border/50 p-4">
      {/* Terminal-style header */}
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
        <Globe className="h-4 w-4 text-accent" />
        <span className="text-xs font-mono text-muted-foreground">domain-scanner</span>
        <span className="text-xs text-muted-foreground ml-auto">/{phase.items.length} endpoints</span>
      </div>

      {/* Directory tree */}
      <div className="space-y-1 font-mono text-sm">
        {treeItems.map((item, i) => {
          const isVisible = visibleItems.includes(i)
          const isActive = activeItem === i
          const isPulsing = pulseItem === i
          
          return (
            <div
              key={item.name}
              className={`flex items-center gap-2 py-1 px-2 rounded transition-all duration-300 ${
                !isVisible ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"
              } ${isActive ? "bg-accent/10" : ""} ${isPulsing ? "bg-accent/20" : ""}`}
              style={{ 
                marginLeft: item.indent * 20,
                transitionDelay: `${i * 80}ms` 
              }}
            >
              {/* Icon */}
              <div className={`w-4 h-4 flex items-center justify-center ${isActive ? "text-accent" : "text-muted-foreground"}`}>
                {item.icon === "folder" && <span className="text-xs">+</span>}
                {item.icon === "search" && <span className="text-xs">@</span>}
                {item.icon === "dns" && <span className="text-xs">#</span>}
                {item.icon === "lock" && <span className="text-xs">*</span>}
                {item.icon === "clock" && <span className="text-xs">~</span>}
              </div>
              
              {/* Name */}
              <span className={`text-xs transition-colors ${
                item.type === "folder" 
                  ? "text-accent font-medium" 
                  : isActive ? "text-foreground" : "text-muted-foreground"
              }`}>
                {item.name}
              </span>

              {/* Status indicator */}
              {isVisible && (
                <div className="ml-auto flex items-center gap-1">
                  {isActive && (
                    <span className="text-[10px] text-accent animate-pulse">scanning...</span>
                  )}
                  {!isActive && i < visibleItems.length - 1 && (
                    <span className="text-[10px] text-accent/60">done</span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Connection lines visualization */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="flex items-center gap-1">
          {phase.items.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                visibleItems.includes(i) ? "bg-accent" : "bg-muted"
              }`}
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

// Phase 2: Performance - Waterfall chart animation
function PerformanceAnimation({ phase, progress }: { phase: AuditPhase; progress: number }) {
  // Pre-calculate stable values for each bar (only once per phase)
  const barConfig = useMemo(() => 
    phase.items.map((item, i) => {
      // Staggered start times - later items start later (realistic waterfall)
      const startDelay = i * 8 + (i > 2 ? 5 : 0) + (i > 5 ? 10 : 0) // Adds variation
      // Each resource has different load duration
      const loadDuration = 15 + (i % 3) * 12 + (i % 2) * 8 // Varies between 15-35
      const color = i % 3 === 0 ? "bg-accent" : i % 3 === 1 ? "bg-warning" : "bg-muted-foreground/70"
      return { id: item, startDelay, loadDuration, color }
    }), [phase.items]
  )

  // Track current widths - only ever increase, never decrease
  const [barWidths, setBarWidths] = useState<number[]>(() => phase.items.map(() => 0))

  useEffect(() => {
    setBarWidths(prev => 
      barConfig.map((bar, i) => {
        // Calculate target width based on progress
        // Bar starts loading when progress reaches its startDelay
        // Bar finishes when progress reaches startDelay + loadDuration
        const barStart = bar.startDelay
        const barEnd = bar.startDelay + bar.loadDuration
        
        let targetWidth = 0
        if (progress >= barEnd) {
          targetWidth = 100
        } else if (progress > barStart) {
          targetWidth = ((progress - barStart) / bar.loadDuration) * 100
        }
        
        // Only increase, never decrease (no backwards animation)
        return Math.max(prev[i], targetWidth)
      })
    )
  }, [progress, barConfig])

  return (
    <div className="relative h-64 rounded-lg bg-background/50 overflow-hidden border border-border/50 p-4">
      {/* Waterfall header */}
      <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground">
        <span>Resource</span>
        <div className="flex gap-8 pr-2">
          <span>0ms</span>
          <span>250ms</span>
          <span>500ms</span>
        </div>
      </div>

      {/* Waterfall bars */}
      <div className="space-y-1.5">
        {barConfig.map((bar, i) => {
          const width = barWidths[i] || 0
          const startPercent = (bar.startDelay / 100) * 90 // Scale to fit
          const widthPercent = (width / 100) * (bar.loadDuration / 100) * 90
          
          return (
            <div key={bar.id} className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-24 truncate font-mono">
                {bar.id.replace(".ts", "").replace(".tsx", "").replace(".json", "")}
              </span>
              <div className="flex-1 h-3 bg-muted/20 rounded overflow-hidden relative">
                {/* Timing grid lines */}
                <div className="absolute inset-0 flex">
                  {[25, 50, 75].map(pos => (
                    <div key={pos} className="absolute top-0 bottom-0 w-px bg-border/30" style={{ left: `${pos}%` }} />
                  ))}
                </div>
                {/* The loading bar */}
                <div
                  className={`absolute top-0 bottom-0 ${bar.color} rounded transition-all duration-200 ease-out`}
                  style={{
                    left: `${startPercent}%`,
                    width: `${widthPercent}%`,
                  }}
                />
              </div>
              {/* Time indicator */}
              <span className="text-[9px] font-mono text-muted-foreground w-10 text-right">
                {width > 0 ? `${Math.round(bar.startDelay * 5 + (width / 100) * bar.loadDuration * 5)}ms` : "—"}
              </span>
            </div>
          )
        })}
      </div>

      {/* Scanning indicator */}
      <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
        <div className="relative">
          <div className="w-1.5 h-1.5 rounded-full bg-warning" />
          <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-warning animate-ping" />
        </div>
        <span>Analyzing resource timing...</span>
      </div>
    </div>
  )
}

// Phase 3: SEO - Structured grid of metrics
function SEOAnimation({ phase, progress }: { phase: AuditPhase; progress: number }) {
  const [activeItems, setActiveItems] = useState<number[]>([])
  const [currentScan, setCurrentScan] = useState(0)

  useEffect(() => {
    const count = Math.floor((progress / 100) * phase.items.length)
    setActiveItems(Array.from({ length: count }, (_, i) => i))
  }, [progress, phase.items.length])

  // Cycle through active items for scan indicator
  useEffect(() => {
    if (activeItems.length === 0) return
    const interval = setInterval(() => {
      setCurrentScan((prev) => (prev + 1) % phase.items.length)
    }, 400)
    return () => clearInterval(interval)
  }, [activeItems.length, phase.items.length])

  const seoMetrics = useMemo(() => [
    { name: "Meta Tags", icon: "tag", category: "On-Page" },
    { name: "Schema Markup", icon: "code", category: "On-Page" },
    { name: "Sitemap", icon: "map", category: "Technical" },
    { name: "Robots.txt", icon: "bot", category: "Technical" },
    { name: "Backlinks", icon: "link", category: "Off-Page" },
    { name: "Keywords", icon: "key", category: "Content" },
    { name: "Canonicals", icon: "copy", category: "Technical" },
    { name: "Headings", icon: "heading", category: "Content" },
    { name: "Alt Text", icon: "image", category: "Content" },
  ], [])

  const categories = ["On-Page", "Technical", "Content", "Off-Page"]

  return (
    <div className="relative h-64 rounded-lg bg-background/50 overflow-hidden border border-border/50 p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
        <Search className="h-4 w-4 text-accent" />
        <span className="text-xs font-mono text-muted-foreground">seo-analyzer</span>
        <span className="text-xs text-muted-foreground ml-auto">{activeItems.length}/{phase.items.length} checks</span>
      </div>

      {/* Structured grid */}
      <div className="grid grid-cols-3 gap-2">
        {seoMetrics.map((metric, i) => {
          const isActive = activeItems.includes(i)
          const isScanning = currentScan === i && !isActive
          const category = categories.indexOf(metric.category)
          
          return (
            <div
              key={metric.name}
              className={`relative px-2 py-2 rounded-md border transition-all duration-300 ${
                isActive
                  ? "bg-accent/10 border-accent/40 text-accent"
                  : isScanning
                    ? "bg-muted/50 border-accent/30 text-muted-foreground"
                    : "bg-muted/20 border-border/30 text-muted-foreground/60"
              }`}
              style={{ transitionDelay: `${i * 30}ms` }}
            >
              {/* Category indicator */}
              <div className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full transition-colors ${
                isActive 
                  ? category === 0 ? "bg-accent" : category === 1 ? "bg-warning" : category === 2 ? "bg-chart-2" : "bg-chart-3"
                  : "bg-muted"
              }`} />
              
              {/* Metric name */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium truncate">{metric.name}</span>
              </div>
              
              {/* Status */}
              <div className="mt-1 flex items-center gap-1">
                {isActive && (
                  <span className="text-[8px] text-accent">complete</span>
                )}
                {isScanning && (
                  <span className="text-[8px] text-muted-foreground animate-pulse">scanning...</span>
                )}
                {!isActive && !isScanning && (
                  <span className="text-[8px] text-muted-foreground/40">pending</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Category legend */}
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

// Phase 4: UI Evaluation - Device frames with scanning
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
          return [
            ...prev,
            {
              x: 20 + Math.random() * 60,
              y: 20 + Math.random() * 60,
              type: types[Math.floor(Math.random() * types.length)],
            },
          ]
        })
      }, 800)
      return () => clearInterval(interval)
    }
  }, [progress, highlights])

  return (
    <div className="relative h-64 rounded-lg bg-background/50 overflow-hidden border border-border/50 p-4">
      <div className="flex items-center justify-center gap-6 h-full">
        {/* Desktop frame */}
        <div className="relative w-48 h-32 rounded-lg border-2 border-border bg-card overflow-hidden">
          <div className="h-4 bg-muted border-b border-border flex items-center px-2 gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-destructive/60" />
            <div className="w-1.5 h-1.5 rounded-full bg-warning/60" />
            <div className="w-1.5 h-1.5 rounded-full bg-accent/60" />
          </div>
          <div className="relative h-full">
            {/* Content placeholder */}
            <div className="p-2 space-y-1">
              <div className="h-2 w-16 bg-muted rounded" />
              <div className="h-1 w-24 bg-muted/50 rounded" />
              <div className="h-1 w-20 bg-muted/50 rounded" />
              <div className="h-6 w-full bg-muted/30 rounded mt-2" />
            </div>
            {/* Scan overlay */}
            <div
              className="absolute left-0 right-0 h-1 bg-gradient-to-b from-accent to-transparent"
              style={{ top: `${scanProgress.desktop}%`, transition: "top 0.1s linear" }}
            />
            {/* Highlight points */}
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
          <span className="absolute bottom-1 right-2 text-[8px] text-muted-foreground">Desktop</span>
        </div>

        {/* Mobile frame */}
        <div className="relative w-20 h-40 rounded-xl border-2 border-border bg-card overflow-hidden">
          <div className="h-3 bg-muted border-b border-border flex items-center justify-center">
            <div className="w-6 h-1 rounded-full bg-border" />
          </div>
          <div className="relative h-full">
            {/* Content placeholder */}
            <div className="p-1.5 space-y-1">
              <div className="h-1.5 w-10 bg-muted rounded" />
              <div className="h-1 w-12 bg-muted/50 rounded" />
              <div className="h-4 w-full bg-muted/30 rounded mt-1" />
              <div className="h-1 w-8 bg-muted/50 rounded" />
            </div>
            {/* Scan overlay */}
            <div
              className="absolute left-0 right-0 h-1 bg-gradient-to-b from-accent to-transparent"
              style={{ top: `${scanProgress.mobile}%`, transition: "top 0.1s linear" }}
            />
            {/* Highlight points */}
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
          <span className="absolute bottom-1 right-1 text-[6px] text-muted-foreground">Mobile</span>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-2 left-2 flex gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-accent" /> Pass</span>
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-warning" /> Warning</span>
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-destructive" /> Issue</span>
      </div>
    </div>
  )
}

// Phase 5: Scoring - Expanded animated score counters with many rubrics
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

  // Calculate scores progressively
  useEffect(() => {
    const newScores: Record<string, number> = {}
    scoreRubrics.forEach((rubric, i) => {
      // Each rubric completes at a staggered point
      const rubricStart = (i / scoreRubrics.length) * 70
      const rubricEnd = rubricStart + 25
      
      if (progress >= rubricEnd) {
        newScores[rubric.id] = rubric.target
      } else if (progress > rubricStart) {
        const rubricProgress = (progress - rubricStart) / (rubricEnd - rubricStart)
        newScores[rubric.id] = Math.floor(rubric.target * rubricProgress)
      } else {
        newScores[rubric.id] = 0
      }
    })
    setScores(newScores)
  }, [progress, scoreRubrics])

  // Cycle through active rubric for visual interest
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % scoreRubrics.length)
    }, 300)
    return () => clearInterval(interval)
  }, [scoreRubrics.length])

  // Calculate weighted overall score
  const overallScore = useMemo(() => {
    let weighted = 0
    let totalWeight = 0
    scoreRubrics.forEach((rubric) => {
      weighted += (scores[rubric.id] || 0) * rubric.weight
      totalWeight += rubric.weight
    })
    return Math.round(weighted / totalWeight)
  }, [scores, scoreRubrics])

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-accent"
    if (score >= 60) return "text-warning"
    return "text-destructive"
  }

  const getBarColor = (score: number) => {
    if (score >= 80) return "bg-accent"
    if (score >= 60) return "bg-warning"
    return "bg-destructive"
  }

  return (
    <div className="relative h-64 rounded-lg bg-background/50 overflow-hidden border border-border/50 p-3">
      <div className="flex gap-3 h-full">
        {/* Rubrics list - scrollable area */}
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
                <div 
                  key={rubric.id} 
                  className={`flex items-center gap-2 py-1 px-1.5 rounded transition-colors ${
                    isActive ? "bg-muted/50" : ""
                  }`}
                >
                  {/* Status dot */}
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    isComplete ? getBarColor(score) : isActive ? "bg-accent animate-pulse" : "bg-muted"
                  }`} />
                  
                  {/* Label */}
                  <span className={`text-[10px] w-20 truncate ${
                    isComplete ? "text-foreground" : "text-muted-foreground"
                  }`}>
                    {rubric.label}
                  </span>
                  
                  {/* Progress bar */}
                  <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${getBarColor(score)}`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  
                  {/* Score */}
                  <span className={`text-[10px] font-mono font-medium w-6 text-right tabular-nums ${
                    score > 0 ? getScoreColor(score) : "text-muted-foreground/40"
                  }`}>
                    {score > 0 ? score : "—"}
                  </span>
                  
                  {/* Weight indicator */}
                  <span className="text-[8px] text-muted-foreground/50 w-6 text-right">
                    {rubric.weight}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Overall score circle */}
        <div className="w-28 flex flex-col items-center justify-center border-l border-border/50 pl-3">
          <svg viewBox="0 0 100 100" className="w-20 h-20">
            <defs>
              <filter id="score-glow-expanded">
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Background circle */}
            <circle cx="50" cy="50" r="40" fill="none" stroke="var(--color-muted)" strokeWidth="6" />
            
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={overallScore >= 80 ? "var(--color-accent)" : overallScore >= 60 ? "var(--color-warning)" : "var(--color-destructive)"}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - overallScore / 100)}`}
              transform="rotate(-90 50 50)"
              filter="url(#score-glow-expanded)"
              style={{ transition: "stroke-dashoffset 0.3s ease" }}
            />
            
            {/* Score text */}
            <text x="50" y="46" textAnchor="middle" className="fill-foreground font-bold" style={{ fontSize: "22px" }}>
              {overallScore}
            </text>
            <text x="50" y="62" textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: "8px" }}>
              OVERALL
            </text>
          </svg>
          
          {/* Weighted label */}
          <span className="text-[9px] text-muted-foreground mt-1">Weighted Score</span>
          
          {/* Calculating indicator */}
          {progress < 100 && (
            <div className="flex items-center gap-1 mt-2">
              <div className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1 h-1 rounded-full bg-accent animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Animation viewer component for testing all phases
export function PhaseAnimationViewer() {
  const [currentPhase, setCurrentPhase] = useState(0)
  const [phaseProgress, setPhaseProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)

  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setPhaseProgress((prev) => {
        if (prev >= 100) {
          setCurrentPhase((p) => (p + 1) % AUDIT_PHASES.length)
          return 0
        }
        return prev + 2
      })
    }, 100)

    return () => clearInterval(interval)
  }, [isPlaying])

  const overallProgress = Math.floor(
    ((currentPhase * 100 + phaseProgress) / (AUDIT_PHASES.length * 100)) * 100
  )

  return (
    <div className="space-y-6">
      <MultiPhaseScanner
        currentPhase={currentPhase}
        phaseProgress={phaseProgress}
        overallProgress={overallProgress}
      />
      
      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="px-4 py-2 rounded-lg bg-card border border-border text-sm font-medium hover:bg-muted transition-colors"
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button
          onClick={() => {
            setCurrentPhase(0)
            setPhaseProgress(0)
          }}
          className="px-4 py-2 rounded-lg bg-card border border-border text-sm font-medium hover:bg-muted transition-colors"
        >
          Reset
        </button>
        <div className="flex gap-2">
          {AUDIT_PHASES.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setCurrentPhase(i)
                setPhaseProgress(0)
              }}
              className={`w-8 h-8 rounded-lg border text-xs font-medium transition-colors ${
                i === currentPhase
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card border-border hover:bg-muted"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
