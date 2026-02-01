"use client"

import { useEffect, useState, useMemo } from "react"

interface ScannerProps {
  progress: number
  currentCheck: string
}

// File tags for the v0-style animation
const FILE_TAGS = [
  { name: "seo-meta.ts", color: "accent" },
  { name: "performance.tsx", color: "accent" },
  { name: "mobile-audit.ts", color: "muted" },
  { name: "trust-signals.tsx", color: "accent" },
  { name: "conversion.ts", color: "muted" },
  { name: "lighthouse.json", color: "accent" },
  { name: "pagespeed.ts", color: "muted" },
  { name: "schema-validator.tsx", color: "accent" },
  { name: "booking-flow.ts", color: "muted" },
  { name: "accessibility.tsx", color: "accent" },
]

// V0-style scanner with floating tags and progress bars
export function V0Scanner({ progress, currentCheck }: ScannerProps) {
  const [scanLineY, setScanLineY] = useState(0)
  const [visibleTags, setVisibleTags] = useState<number[]>([])
  const [progressBars, setProgressBars] = useState<{ id: number; width: number; y: number; color: string }[]>([])

  // Generate tag positions once
  const tagPositions = useMemo(() => 
    FILE_TAGS.map((_, i) => ({
      x: 20 + (i % 3) * 120,
      y: 40 + Math.floor(i / 3) * 50,
      delay: i * 150,
    })), []
  )

  // Scan line animation
  useEffect(() => {
    const interval = setInterval(() => {
      setScanLineY((prev) => (prev + 2) % 280)
    }, 30)
    return () => clearInterval(interval)
  }, [])

  // Reveal tags based on scan line position
  useEffect(() => {
    const newVisible: number[] = []
    tagPositions.forEach((pos, i) => {
      if (scanLineY > pos.y - 20) {
        newVisible.push(i)
      }
    })
    setVisibleTags(newVisible)
  }, [scanLineY, tagPositions])

  // Animated progress bars
  useEffect(() => {
    const interval = setInterval(() => {
      setProgressBars((prev) => {
        const filtered = prev
          .map((bar) => ({ ...bar, width: bar.width + Math.random() * 8 }))
          .filter((bar) => bar.width < 160)
        
        if (filtered.length < 6 && Math.random() > 0.5) {
          const colors = ["bg-accent", "bg-accent/70", "bg-accent/50", "bg-muted-foreground/50"]
          filtered.push({
            id: Date.now(),
            width: 20 + Math.random() * 30,
            y: 180 + Math.random() * 60,
            color: colors[Math.floor(Math.random() * colors.length)],
          })
        }
        return filtered
      })
    }, 80)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Main container with frosted glass effect */}
      <div className="relative overflow-hidden rounded-2xl bg-card/80 backdrop-blur-xl border border-border shadow-2xl">
        <div className="p-6">
          {/* Header with status */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive/80" />
                <div className="w-3 h-3 rounded-full bg-warning/80" />
                <div className="w-3 h-3 rounded-full bg-accent/80" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">audit-scanner.tsx</span>
            </div>
            <div className="text-xs font-mono text-muted-foreground">{progress}%</div>
          </div>

          {/* Scan area */}
          <div className="relative h-64 rounded-lg bg-background/50 overflow-hidden border border-border/50">
            {/* Floating file tags */}
            {FILE_TAGS.map((tag, i) => {
              const pos = tagPositions[i]
              const isVisible = visibleTags.includes(i)
              return (
                <div
                  key={tag.name}
                  className={`absolute px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-500 ${
                    isVisible 
                      ? "opacity-100 translate-y-0" 
                      : "opacity-0 -translate-y-4"
                  } ${
                    tag.color === "accent" 
                      ? "bg-accent/20 text-accent border border-accent/30" 
                      : "bg-muted text-muted-foreground border border-border"
                  }`}
                  style={{
                    left: pos.x,
                    top: pos.y,
                    transitionDelay: `${pos.delay}ms`,
                  }}
                >
                  {tag.name}
                </div>
              )
            })}

            {/* Scan line */}
            <div
              className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent"
              style={{ top: scanLineY }}
            />
            <div
              className="absolute left-0 right-0 h-8 bg-gradient-to-b from-accent/10 to-transparent pointer-events-none"
              style={{ top: scanLineY }}
            />

            {/* Progress bars area */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background/80 to-transparent">
              {progressBars.map((bar) => (
                <div
                  key={bar.id}
                  className={`absolute h-1.5 rounded-full ${bar.color} transition-all duration-100`}
                  style={{
                    width: bar.width,
                    top: bar.y - 180,
                    left: 16,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Status footer */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-accent animate-ping" />
              </div>
              <span className="text-sm font-medium text-foreground">Working</span>
            </div>
            <span className="text-xs text-muted-foreground">{currentCheck}</span>
          </div>

          {/* Main progress bar */}
          <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Radar style scanner
export function RadarScanner({ progress, currentCheck }: ScannerProps) {
  const [rotation, setRotation] = useState(0)
  const [dataPoints, setDataPoints] = useState<{ x: number; y: number; opacity: number }[]>([])

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => (prev + 2) % 360)
    }, 50)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setDataPoints((prev) => {
        const newPoints = [...prev]
        if (newPoints.length < 12) {
          const angle = Math.random() * Math.PI * 2
          const radius = 60 + Math.random() * 30
          newPoints.push({
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
            opacity: 1,
          })
        }
        return newPoints
          .map((p) => ({ ...p, opacity: p.opacity - 0.02 }))
          .filter((p) => p.opacity > 0)
      })
    }, 100)
    return () => clearInterval(interval)
  }, [])

  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="relative flex items-center justify-center">
      <div className="absolute h-52 w-52 rounded-full bg-accent/10 blur-2xl" />
      
      <svg width="200" height="200" viewBox="0 0 200 200" className="relative z-10">
        <defs>
          <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-accent)" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.5" />
          </linearGradient>
          <filter id="radarGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Background circles */}
        <circle cx="100" cy="100" r="90" fill="none" stroke="var(--color-border)" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
        <circle cx="100" cy="100" r="70" fill="none" stroke="var(--color-border)" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
        <circle cx="100" cy="100" r="50" fill="none" stroke="var(--color-border)" strokeWidth="1" opacity="0.2" />

        {/* Progress track & ring */}
        <circle cx="100" cy="100" r="45" fill="none" stroke="var(--color-muted)" strokeWidth="6" opacity="0.3" />
        <circle
          cx="100" cy="100" r="45" fill="none"
          stroke="url(#radarGradient)" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 100 100)" filter="url(#radarGlow)"
          style={{ transition: "stroke-dashoffset 0.3s ease" }}
        />

        {/* Rotating scanner */}
        <g transform={`rotate(${rotation} 100 100)`}>
          <line x1="100" y1="100" x2="100" y2="15" stroke="var(--color-accent)" strokeWidth="2" opacity="0.6" filter="url(#radarGlow)" />
          <path
            d={`M 100 100 L 100 15 A 85 85 0 0 1 ${100 + 85 * Math.sin(Math.PI / 6)} ${100 - 85 * Math.cos(Math.PI / 6)} Z`}
            fill="var(--color-accent)" opacity="0.1"
          />
        </g>

        {/* Data points */}
        {dataPoints.map((point, i) => (
          <circle key={i} cx={100 + point.x} cy={100 + point.y} r="3" fill="var(--color-accent)" opacity={point.opacity} filter="url(#radarGlow)" />
        ))}

        {/* Center hub */}
        <circle cx="100" cy="100" r="20" fill="var(--color-card)" stroke="var(--color-border)" strokeWidth="2" />
        <circle cx="100" cy="100" r="8" fill="var(--color-accent)" opacity="0.8" filter="url(#radarGlow)">
          <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" />
        </circle>

        <text x="100" y="106" textAnchor="middle" className="fill-foreground font-bold" style={{ fontSize: "18px" }}>
          {progress}%
        </text>
      </svg>

      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-lg border border-border">
        {currentCheck}
      </div>
    </div>
  )
}

// Pulse style scanner
export function PulseScanner({ progress, currentCheck }: ScannerProps) {
  const [pulseIndex, setPulseIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseIndex((prev) => (prev + 1) % 4)
    }, 800)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative flex items-center justify-center">
      <svg width="200" height="200" viewBox="0 0 200 200" className="relative z-10">
        <defs>
          <filter id="pulseGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Pulsing rings */}
        {[0, 1, 2, 3].map((i) => (
          <circle
            key={i}
            cx="100"
            cy="100"
            r={30 + i * 20}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2"
            opacity={pulseIndex === i ? 0.8 : 0.15}
            filter={pulseIndex === i ? "url(#pulseGlow)" : undefined}
            style={{ transition: "opacity 0.3s ease" }}
          />
        ))}

        {/* Progress arc at bottom */}
        <path
          d={`M 20 180 Q 100 140 180 180`}
          fill="none"
          stroke="var(--color-muted)"
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.3"
        />
        <path
          d={`M 20 180 Q 100 140 180 180`}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="200"
          strokeDashoffset={200 - (progress / 100) * 200}
          filter="url(#pulseGlow)"
          style={{ transition: "stroke-dashoffset 0.3s ease" }}
        />

        {/* Center content */}
        <circle cx="100" cy="100" r="35" fill="var(--color-card)" stroke="var(--color-border)" strokeWidth="2" />
        
        {/* Animated center dot */}
        <circle cx="100" cy="100" r="12" fill="var(--color-accent)" filter="url(#pulseGlow)">
          <animate attributeName="r" values="10;14;10" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite" />
        </circle>

        <text x="100" y="106" textAnchor="middle" className="fill-foreground font-bold" style={{ fontSize: "20px" }}>
          {progress}%
        </text>
      </svg>

      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-lg border border-border">
        {currentCheck}
      </div>
    </div>
  )
}

// Grid style scanner
export function GridScanner({ progress, currentCheck }: ScannerProps) {
  const [activeCells, setActiveCells] = useState<Set<number>>(new Set())
  const [scanLine, setScanLine] = useState(0)
  const gridSize = 8
  const totalCells = gridSize * gridSize
  const filledCells = Math.floor((progress / 100) * totalCells)

  useEffect(() => {
    const interval = setInterval(() => {
      setScanLine((prev) => (prev + 1) % gridSize)
    }, 200)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const newActive = new Set<number>()
    for (let i = 0; i < filledCells; i++) {
      newActive.add(i)
    }
    setActiveCells(newActive)
  }, [filledCells])

  return (
    <div className="relative flex items-center justify-center">
      <svg width="200" height="200" viewBox="0 0 200 200" className="relative z-10">
        <defs>
          <filter id="gridGlow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Grid cells */}
        {Array.from({ length: totalCells }).map((_, i) => {
          const row = Math.floor(i / gridSize)
          const col = i % gridSize
          const x = 20 + col * 20
          const y = 20 + row * 20
          const isActive = activeCells.has(i)
          const isScanning = row === scanLine

          return (
            <rect
              key={i}
              x={x}
              y={y}
              width="16"
              height="16"
              rx="2"
              fill={isActive ? "var(--color-accent)" : "var(--color-muted)"}
              opacity={isActive ? 0.9 : isScanning ? 0.4 : 0.15}
              filter={isActive || isScanning ? "url(#gridGlow)" : undefined}
              style={{ transition: "fill 0.2s ease, opacity 0.2s ease" }}
            />
          )
        })}

        {/* Scan line highlight */}
        <rect
          x="18"
          y={18 + scanLine * 20}
          width="164"
          height="20"
          rx="2"
          fill="var(--color-accent)"
          opacity="0.1"
        />

        {/* Percentage overlay */}
        <rect x="60" y="80" width="80" height="40" rx="8" fill="var(--color-card)" stroke="var(--color-border)" strokeWidth="2" />
        <text x="100" y="106" textAnchor="middle" className="fill-foreground font-bold" style={{ fontSize: "18px" }}>
          {progress}%
        </text>
      </svg>

      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-lg border border-border">
        {currentCheck}
      </div>
    </div>
  )
}

// Minimal style scanner
export function MinimalScanner({ progress, currentCheck }: ScannerProps) {
  const [dots, setDots] = useState("")

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."))
    }, 400)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative flex flex-col items-center justify-center gap-6">
      {/* Large number */}
      <div className="relative">
        <span className="text-7xl font-bold text-foreground tabular-nums">
          {progress}
        </span>
        <span className="absolute -right-8 top-2 text-2xl font-medium text-muted-foreground">%</span>
      </div>

      {/* Simple progress bar */}
      <div className="relative h-1.5 w-48 overflow-hidden rounded-full bg-muted">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
        {/* Animated shine */}
        <div 
          className="absolute top-0 h-full w-8 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          style={{
            animation: "shine 1.5s infinite",
            left: `${(progress / 100) * 100 - 10}%`,
          }}
        />
      </div>

      {/* Status text */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
        <span>{currentCheck}{dots}</span>
      </div>

      <style jsx>{`
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  )
}
