"use client"

import { useState, useEffect } from "react"
import { Globe, Zap, Search, Eye, Calculator, Check, ChevronLeft, Play, Pause, RotateCcw } from "lucide-react"
import Link from "next/link"

// Phase data
const PHASES = [
  { id: "domain", name: "Domain", icon: Globe },
  { id: "performance", name: "Performance", icon: Zap },
  { id: "seo", name: "SEO", icon: Search },
  { id: "ui", name: "UI/UX", icon: Eye },
  { id: "scoring", name: "Scoring", icon: Calculator },
]

// ============================================================================
// Progress Indicator Variants
// ============================================================================

// A: Current - Progress Track (what we use in production)
function ProgressTrack({ currentPhase }: { currentPhase: number }) {
  return (
    <div className="w-full max-w-md">
      <div className="relative">
        <div className="absolute top-3 left-3 right-3 h-px bg-border" />
        <div
          className="absolute top-3 left-3 h-px bg-accent transition-all duration-300 ease-out"
          style={{
            width: PHASES.length > 1
              ? `calc(${(currentPhase / (PHASES.length - 1)) * 100}% - 24px)`
              : '0%'
          }}
        />
        <div className="relative flex justify-between">
          {PHASES.map((p, i) => {
            const Icon = p.icon
            const isComplete = i < currentPhase
            const isCurrent = i === currentPhase
            return (
              <div key={p.id} className="flex flex-col items-center">
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
                  {isComplete ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                  {isCurrent && <div className="absolute inset-0 rounded-full bg-accent animate-ping opacity-30" />}
                </div>
                <span className={`mt-2 text-[10px] font-medium text-center whitespace-nowrap transition-all duration-300
                  ${isCurrent ? "text-foreground" : isComplete ? "text-accent" : "text-muted-foreground"}
                `}>{p.name.split(' ')[0]}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// B: Minimal Dots
function ProgressDots({ currentPhase }: { currentPhase: number }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        {PHASES.map((p, i) => {
          const isComplete = i < currentPhase
          const isCurrent = i === currentPhase
          return (
            <div key={p.id} className="relative">
              <div className={`w-2 h-2 rounded-full transition-all duration-300
                ${isComplete ? "bg-accent" : isCurrent ? "bg-accent" : "bg-muted"}
              `} />
              {isCurrent && <div className="absolute inset-0 w-2 h-2 rounded-full bg-accent animate-ping opacity-50" />}
            </div>
          )
        })}
      </div>
      <span className="text-sm font-medium text-foreground">{PHASES[currentPhase]?.name}</span>
    </div>
  )
}

// ============================================================================
// Domain Label Variants
// ============================================================================

function DomainLabelA({ domain }: { domain: string }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <span className="text-xl text-muted-foreground">Scanning</span>
      <span className="text-xl font-semibold bg-gradient-to-r from-violet-500 to-indigo-400 bg-clip-text text-transparent">
        {domain}
      </span>
    </div>
  )
}

function DomainLabelB({ domain }: { domain: string }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <span className="text-xl text-muted-foreground">Scanning</span>
      <span className="text-xl font-semibold text-foreground relative">
        {domain}
        <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-indigo-400 rounded-full" />
      </span>
    </div>
  )
}

function DomainLabelC({ domain }: { domain: string }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <span className="text-xl text-muted-foreground">Scanning</span>
      <span
        className="text-xl font-semibold text-foreground"
        style={{ textShadow: '0 0 20px rgba(139, 92, 246, 0.5), 0 0 40px rgba(139, 92, 246, 0.3)' }}
      >
        {domain}
      </span>
    </div>
  )
}

function DomainLabelD({ domain }: { domain: string }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <span className="text-xl text-muted-foreground">Scanning</span>
      <span className="px-4 py-1.5 rounded-lg bg-foreground/10 text-foreground font-semibold text-lg">
        {domain}
      </span>
    </div>
  )
}

function DomainLabelE({ domain }: { domain: string }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <span className="text-xl text-muted-foreground">Scanning</span>
      <span className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-violet-500/20 to-indigo-400/20 border border-violet-500/30 text-foreground font-semibold text-lg">
        {domain}
      </span>
    </div>
  )
}

// ============================================================================
// Multi-Select Button Group
// ============================================================================
function MultiSelectGroup({
  options,
  selected,
  onToggle,
  descriptions
}: {
  options: string[]
  selected: string[]
  onToggle: (val: string) => void
  descriptions?: Record<string, string>
}) {
  return (
    <div className="flex items-center gap-1">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onToggle(opt)}
          className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
            selected.includes(opt)
              ? "bg-accent text-white"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          }`}
          title={descriptions?.[opt]}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

// ============================================================================
// Main Page
// ============================================================================
export default function ProgressPlaygroundPage() {
  const [isPlaying, setIsPlaying] = useState(true)
  const [overallProgress, setOverallProgress] = useState(0)
  const [testDomain, setTestDomain] = useState("example-stays.com")

  // Variant selections (multi-select for stacking)
  const [progressVariants, setProgressVariants] = useState<string[]>(["A"])
  const [domainVariants, setDomainVariants] = useState<string[]>(["A"])

  const toggleProgress = (v: string) => {
    setProgressVariants(prev =>
      prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]
    )
  }

  const toggleDomain = (v: string) => {
    setDomainVariants(prev =>
      prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]
    )
  }

  // Calculate current phase from overall progress
  const currentPhase = Math.min(Math.floor(overallProgress / 20), PHASES.length - 1)

  // Animate progress
  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      setOverallProgress((prev) => prev >= 100 ? 0 : prev + 0.5)
    }, 50)
    return () => clearInterval(interval)
  }, [isPlaying])

  const reset = () => setOverallProgress(0)

  const progressDescriptions: Record<string, string> = {
    A: "Track with icons (current)",
    B: "Minimal dots",
  }

  const domainDescriptions: Record<string, string> = {
    A: "Gradient text",
    B: "Underline accent",
    C: "Subtle glow",
    D: "Pill badge",
    E: "Gradient pill",
  }

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dev"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Dev Tools
          </Link>
          <h1 className="text-2xl font-semibold text-foreground">Scanner UI Playground</h1>
          <p className="text-muted-foreground mt-1">
            Test different UI treatments for the scanner
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 mb-8 p-4 rounded-xl border border-border bg-card">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Domain:</label>
            <input
              type="text"
              value={testDomain}
              onChange={(e) => setTestDomain(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm font-mono w-48"
            />
          </div>
        </div>

        {/* Progress Indicator */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-foreground">Progress Indicator</h2>
            <MultiSelectGroup
              options={["A", "B"]}
              selected={progressVariants}
              onToggle={toggleProgress}
              descriptions={progressDescriptions}
            />
          </div>
          <div className="space-y-3">
            {progressVariants.length === 0 && (
              <div className="p-8 rounded-2xl border border-dashed border-border bg-card/50 flex items-center justify-center min-h-[120px]">
                <span className="text-sm text-muted-foreground">Select variants to compare</span>
              </div>
            )}
            {progressVariants.sort().map((v) => (
              <div key={v} className="p-8 rounded-2xl border border-border bg-card">
                <div className="flex items-center justify-center min-h-[80px]">
                  {v === "A" && <ProgressTrack currentPhase={currentPhase} />}
                  {v === "B" && <ProgressDots currentPhase={currentPhase} />}
                </div>
                <p className="text-xs text-muted-foreground mt-4 text-center font-mono">
                  {v}: {progressDescriptions[v]}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Domain Label */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-foreground">Domain Label</h2>
            <MultiSelectGroup
              options={["A", "B", "C", "D", "E"]}
              selected={domainVariants}
              onToggle={toggleDomain}
              descriptions={domainDescriptions}
            />
          </div>
          <div className="space-y-3">
            {domainVariants.length === 0 && (
              <div className="p-8 rounded-2xl border border-dashed border-border bg-card/50 flex items-center justify-center min-h-[80px]">
                <span className="text-sm text-muted-foreground">Select variants to compare</span>
              </div>
            )}
            {domainVariants.sort().map((v) => (
              <div key={v} className="p-8 rounded-2xl border border-border bg-card">
                <div className="flex items-center justify-center">
                  {v === "A" && <DomainLabelA domain={testDomain} />}
                  {v === "B" && <DomainLabelB domain={testDomain} />}
                  {v === "C" && <DomainLabelC domain={testDomain} />}
                  {v === "D" && <DomainLabelD domain={testDomain} />}
                  {v === "E" && <DomainLabelE domain={testDomain} />}
                </div>
                <p className="text-xs text-muted-foreground mt-4 text-center font-mono">
                  {v}: {domainDescriptions[v]}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
