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

type VariantId = "pills" | "track" | "dots" | "minimal" | "stepper" | "segments"

interface VariantProps {
  currentPhase: number
  phaseProgress: number
  overallProgress: number
}

// ============================================================================
// Variant 1: Equal-Width Pills (fixed)
// ============================================================================
function PillsVariant({ currentPhase, overallProgress }: VariantProps) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {PHASES.map((p, i) => {
        const Icon = p.icon
        const isComplete = i < currentPhase
        const isCurrent = i === currentPhase

        return (
          <div
            key={p.id}
            className={`
              flex items-center justify-center gap-1.5
              w-24 py-1.5 rounded-full text-xs font-medium
              transition-all duration-300
              ${isCurrent
                ? "bg-accent text-white"
                : isComplete
                  ? "bg-accent/15 text-accent"
                  : "bg-muted text-muted-foreground"
              }
            `}
          >
            <Icon className="h-3 w-3" />
            <span className="truncate">{p.name}</span>
          </div>
        )
      })}
    </div>
  )
}

// ============================================================================
// Variant 2: Progress Track with Dots (properly spaced)
// ============================================================================
function TrackVariant({ currentPhase, overallProgress }: VariantProps) {
  return (
    <div className="w-full max-w-lg">
      {/* Track container */}
      <div className="relative">
        {/* Background track line */}
        <div className="absolute top-3 left-6 right-6 h-px bg-border" />
        {/* Filled track line */}
        <div
          className="absolute top-3 left-6 h-px bg-accent transition-all duration-300 ease-out"
          style={{ width: `calc(${(currentPhase / (PHASES.length - 1)) * 100}% - 3rem + ${currentPhase > 0 ? '1.5rem' : '0px'})` }}
        />

        {/* Phase indicators */}
        <div className="relative flex justify-between">
          {PHASES.map((p, i) => {
            const Icon = p.icon
            const isComplete = i < currentPhase
            const isCurrent = i === currentPhase

            return (
              <div key={p.id} className="flex flex-col items-center w-16">
                {/* Circle */}
                <div className={`
                  relative w-6 h-6 rounded-full flex items-center justify-center
                  transition-all duration-300 ease-out
                  ${isComplete
                    ? "bg-accent text-white"
                    : isCurrent
                      ? "bg-accent text-white ring-4 ring-accent/20"
                      : "bg-muted text-muted-foreground border border-border"
                  }
                `}>
                  {isComplete ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Icon className="h-3 w-3" />
                  )}
                  {isCurrent && (
                    <div className="absolute inset-0 rounded-full bg-accent animate-ping opacity-30" />
                  )}
                </div>
                {/* Label - always visible */}
                <span className={`
                  mt-2 text-[10px] font-medium text-center transition-all duration-300
                  ${isCurrent ? "text-foreground" : isComplete ? "text-accent" : "text-muted-foreground"}
                `}>
                  {p.name}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Variant 3: Minimal Dots Only
// ============================================================================
function DotsVariant({ currentPhase }: VariantProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      {/* Dots */}
      <div className="flex items-center gap-2">
        {PHASES.map((p, i) => {
          const isComplete = i < currentPhase
          const isCurrent = i === currentPhase

          return (
            <div key={p.id} className="relative">
              <div className={`
                w-2 h-2 rounded-full transition-all duration-300
                ${isComplete
                  ? "bg-accent"
                  : isCurrent
                    ? "bg-accent"
                    : "bg-muted"
                }
              `} />
              {isCurrent && (
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-accent animate-ping opacity-50" />
              )}
            </div>
          )
        })}
      </div>
      {/* Current phase name */}
      <span className="text-sm font-medium text-foreground">
        {PHASES[currentPhase]?.name}
      </span>
    </div>
  )
}

// ============================================================================
// Variant 4: Ultra Minimal (just text + progress)
// ============================================================================
function MinimalVariant({ currentPhase, overallProgress }: VariantProps) {
  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-xs">
      {/* Phase info */}
      <div className="text-center">
        <span className="text-xs text-muted-foreground font-mono">
          {currentPhase + 1}/{PHASES.length}
        </span>
        <h3 className="text-lg font-medium text-foreground mt-1">
          {PHASES[currentPhase]?.name}
        </h3>
      </div>

      {/* Single progress bar */}
      <div className="w-full">
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500 ease-out"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] text-muted-foreground">Analyzing...</span>
          <span className="text-[10px] text-muted-foreground font-mono">{overallProgress}%</span>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Variant 5: Numbered Stepper with Labels
// ============================================================================
function StepperVariant({ currentPhase }: VariantProps) {
  return (
    <div className="w-full max-w-lg">
      <div className="flex justify-between">
        {PHASES.map((p, i) => {
          const isComplete = i < currentPhase
          const isCurrent = i === currentPhase

          return (
            <div key={p.id} className="flex flex-col items-center w-16">
              {/* Number/check with connecting line */}
              <div className="relative flex items-center justify-center w-full">
                {/* Left connector */}
                {i > 0 && (
                  <div className={`absolute right-1/2 top-1/2 w-full h-px -translate-y-1/2 mr-4 transition-colors duration-300 ${
                    i <= currentPhase ? "bg-accent" : "bg-border"
                  }`} />
                )}
                {/* Number circle */}
                <div className={`
                  relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  transition-all duration-300
                  ${isComplete
                    ? "bg-accent text-white"
                    : isCurrent
                      ? "bg-accent text-white ring-4 ring-accent/20"
                      : "bg-muted text-muted-foreground border border-border"
                  }
                `}>
                  {isComplete ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                {/* Right connector */}
                {i < PHASES.length - 1 && (
                  <div className={`absolute left-1/2 top-1/2 w-full h-px -translate-y-1/2 ml-4 transition-colors duration-300 ${
                    i < currentPhase ? "bg-accent" : "bg-border"
                  }`} />
                )}
              </div>
              {/* Label */}
              <span className={`
                mt-2 text-[10px] font-medium text-center transition-all duration-300
                ${isCurrent ? "text-foreground" : isComplete ? "text-accent" : "text-muted-foreground"}
              `}>
                {p.name}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// Variant 6: Segmented Bar
// ============================================================================
function SegmentsVariant({ currentPhase, phaseProgress, overallProgress }: VariantProps) {
  return (
    <div className="w-full max-w-md">
      {/* Segmented progress bar */}
      <div className="flex gap-1 mb-3">
        {PHASES.map((p, i) => {
          const isComplete = i < currentPhase
          const isCurrent = i === currentPhase

          return (
            <div key={p.id} className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isComplete ? "bg-accent" : isCurrent ? "bg-accent" : "bg-transparent"
                }`}
                style={{
                  width: isComplete ? "100%" : isCurrent ? `${phaseProgress}%` : "0%"
                }}
              />
            </div>
          )
        })}
      </div>

      {/* Current phase label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {(() => {
            const Icon = PHASES[currentPhase]?.icon
            return Icon ? <Icon className="h-4 w-4 text-accent" /> : null
          })()}
          <span className="text-sm font-medium text-foreground">
            {PHASES[currentPhase]?.name}
          </span>
        </div>
        <span className="text-xs text-muted-foreground font-mono">{overallProgress}%</span>
      </div>
    </div>
  )
}

// ============================================================================
// Main Page
// ============================================================================
export default function ProgressVariantsPage() {
  const [isPlaying, setIsPlaying] = useState(true)
  const [overallProgress, setOverallProgress] = useState(0)

  // Calculate current phase and phase progress from overall progress
  const currentPhase = Math.min(Math.floor(overallProgress / 20), PHASES.length - 1)
  const phaseProgress = Math.min(((overallProgress % 20) / 20) * 100, 100)

  // Animate progress - smooth and fast feeling
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setOverallProgress((prev) => {
        if (prev >= 100) return 0
        return prev + 0.3
      })
    }, 50) // 20fps for smooth animation

    return () => clearInterval(interval)
  }, [isPlaying])

  const reset = () => {
    setOverallProgress(0)
  }

  const variants: { id: VariantId; name: string; description: string; component: React.FC<VariantProps> }[] = [
    {
      id: "pills",
      name: "Equal-Width Pills",
      description: "Flat pills with consistent sizing",
      component: PillsVariant,
    },
    {
      id: "track",
      name: "Progress Track",
      description: "Track with icons, labels underneath",
      component: TrackVariant,
    },
    {
      id: "stepper",
      name: "Numbered Stepper",
      description: "Numbers with labels underneath",
      component: StepperVariant,
    },
    {
      id: "segments",
      name: "Segmented Bar",
      description: "Progress bar split into phase segments",
      component: SegmentsVariant,
    },
    {
      id: "dots",
      name: "Minimal Dots",
      description: "Ultra-minimal dot indicators",
      component: DotsVariant,
    },
    {
      id: "minimal",
      name: "Text + Bar",
      description: "Just text and a single progress bar",
      component: MinimalVariant,
    },
  ]

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dev"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Dev Tools
          </Link>
          <h1 className="text-2xl font-semibold text-foreground">Progress Indicator Variants</h1>
          <p className="text-muted-foreground mt-1">
            Compare different visual treatments for the scanning progress
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mb-8 p-4 rounded-xl border border-border bg-card">
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
          <div className="text-sm text-muted-foreground">
            Progress: <span className="font-mono text-foreground">{Math.round(overallProgress)}%</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Phase: <span className="font-mono text-foreground">{currentPhase + 1}/{PHASES.length}</span>
          </div>
        </div>

        {/* Variants Grid */}
        <div className="grid gap-6">
          {variants.map((variant) => {
            const Component = variant.component
            return (
              <div
                key={variant.id}
                className="p-6 rounded-2xl border border-border bg-card"
              >
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="font-medium text-foreground">{variant.name}</h3>
                    <p className="text-sm text-muted-foreground">{variant.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-center py-8 bg-background rounded-xl">
                  <Component
                    currentPhase={currentPhase}
                    phaseProgress={phaseProgress}
                    overallProgress={overallProgress}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
