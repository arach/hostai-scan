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
// Minimal Dots Progress Indicator
// ============================================================================
function DotsProgress({ currentPhase }: { currentPhase: number }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        {PHASES.map((p, i) => {
          const isComplete = i < currentPhase
          const isCurrent = i === currentPhase

          return (
            <div key={p.id} className="relative">
              <div className={`
                w-2 h-2 rounded-full transition-all duration-300
                ${isComplete ? "bg-accent" : isCurrent ? "bg-accent" : "bg-muted"}
              `} />
              {isCurrent && (
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-accent animate-ping opacity-50" />
              )}
            </div>
          )
        })}
      </div>
      <span className="text-sm font-medium text-foreground">
        {PHASES[currentPhase]?.name}
      </span>
    </div>
  )
}

// ============================================================================
// Domain Label Treatments
// ============================================================================
function DomainLabelTreatments({ domain }: { domain: string }) {
  return (
    <div className="space-y-6">
      {/* Option A: Gradient text */}
      <div className="p-6 rounded-xl border border-border bg-card">
        <div className="text-xs text-muted-foreground mb-3 font-mono">A: Gradient Text</div>
        <div className="flex items-center justify-center gap-2">
          <span className="text-xl text-muted-foreground">Scanning</span>
          <span className="text-xl font-semibold bg-gradient-to-r from-violet-500 to-indigo-400 bg-clip-text text-transparent">
            {domain}
          </span>
        </div>
      </div>

      {/* Option B: Underline accent */}
      <div className="p-6 rounded-xl border border-border bg-card">
        <div className="text-xs text-muted-foreground mb-3 font-mono">B: Underline Accent</div>
        <div className="flex items-center justify-center gap-2">
          <span className="text-xl text-muted-foreground">Scanning</span>
          <span className="text-xl font-semibold text-foreground relative">
            {domain}
            <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-indigo-400 rounded-full" />
          </span>
        </div>
      </div>

      {/* Option C: Subtle glow */}
      <div className="p-6 rounded-xl border border-border bg-card">
        <div className="text-xs text-muted-foreground mb-3 font-mono">C: Subtle Glow</div>
        <div className="flex items-center justify-center gap-2">
          <span className="text-xl text-muted-foreground">Scanning</span>
          <span
            className="text-xl font-semibold text-foreground"
            style={{ textShadow: '0 0 20px rgba(139, 92, 246, 0.5), 0 0 40px rgba(139, 92, 246, 0.3)' }}
          >
            {domain}
          </span>
        </div>
      </div>

      {/* Option D: Pill badge */}
      <div className="p-6 rounded-xl border border-border bg-card">
        <div className="text-xs text-muted-foreground mb-3 font-mono">D: Pill Badge</div>
        <div className="flex items-center justify-center gap-3">
          <span className="text-xl text-muted-foreground">Scanning</span>
          <span className="px-4 py-1.5 rounded-lg bg-foreground/10 text-foreground font-semibold text-lg">
            {domain}
          </span>
        </div>
      </div>

      {/* Option E: Gradient pill */}
      <div className="p-6 rounded-xl border border-border bg-card">
        <div className="text-xs text-muted-foreground mb-3 font-mono">E: Gradient Pill</div>
        <div className="flex items-center justify-center gap-3">
          <span className="text-xl text-muted-foreground">Scanning</span>
          <span className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-violet-500/20 to-indigo-400/20 border border-violet-500/30 text-foreground font-semibold text-lg">
            {domain}
          </span>
        </div>
      </div>
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

  // Calculate current phase from overall progress
  const currentPhase = Math.min(Math.floor(overallProgress / 20), PHASES.length - 1)

  // Animate progress
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setOverallProgress((prev) => {
        if (prev >= 100) return 0
        return prev + 0.5
      })
    }, 50)

    return () => clearInterval(interval)
  }, [isPlaying])

  const reset = () => setOverallProgress(0)

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
        <section className="mb-12">
          <h2 className="text-lg font-medium text-foreground mb-4">Progress Indicator</h2>
          <div className="p-8 rounded-2xl border border-border bg-card flex items-center justify-center">
            <DotsProgress currentPhase={currentPhase} />
          </div>
        </section>

        {/* Domain Label Treatments */}
        <section>
          <h2 className="text-lg font-medium text-foreground mb-4">Domain Label Treatments</h2>
          <DomainLabelTreatments domain={testDomain} />
        </section>
      </div>
    </main>
  )
}
