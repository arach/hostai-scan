"use client"

import type { ScoreStyle } from "@/components/_v0-staging/admin-toolbar"

interface ScoreWidgetProps {
  score: number
  style: ScoreStyle
  size?: "sm" | "md" | "lg"
  label?: string
}

export function ScoreWidget({ score, style, size = "lg", label }: ScoreWidgetProps) {
  switch (style) {
    case "circle":
      return <CircleScore score={score} size={size} label={label} />
    case "bar":
      return <BarScore score={score} size={size} label={label} />
    case "gauge":
      return <GaugeScore score={score} size={size} label={label} />
    case "numeric":
      return <NumericScore score={score} size={size} label={label} />
    case "radial":
      return <RadialScore score={score} size={size} label={label} />
    default:
      return <CircleScore score={score} size={size} label={label} />
  }
}

function getScoreColor(score: number) {
  if (score >= 80) return { text: "text-accent", bg: "bg-accent", stroke: "stroke-accent", fill: "fill-accent" }
  if (score >= 50) return { text: "text-warning", bg: "bg-warning", stroke: "stroke-warning", fill: "fill-warning" }
  return { text: "text-destructive", bg: "bg-destructive", stroke: "stroke-destructive", fill: "fill-destructive" }
}

function getSizeConfig(size: "sm" | "md" | "lg") {
  const configs = {
    sm: { dimension: 80, strokeWidth: 4, fontSize: "text-xl", subSize: "text-xs" },
    md: { dimension: 120, strokeWidth: 6, fontSize: "text-3xl", subSize: "text-sm" },
    lg: { dimension: 160, strokeWidth: 8, fontSize: "text-4xl", subSize: "text-sm" },
  }
  return configs[size]
}

// Style 1: Classic Circle
function CircleScore({ score, size, label }: Omit<ScoreWidgetProps, "style">) {
  const config = getSizeConfig(size ?? "lg")
  const radius = (config.dimension - config.strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const colors = getScoreColor(score)

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: config.dimension, height: config.dimension }}>
        <svg className="rotate-[-90deg]" width={config.dimension} height={config.dimension}>
          <circle
            cx={config.dimension / 2}
            cy={config.dimension / 2}
            r={radius}
            fill="none"
            strokeWidth={config.strokeWidth}
            className="stroke-muted"
          />
          <circle
            cx={config.dimension / 2}
            cy={config.dimension / 2}
            r={radius}
            fill="none"
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            className={colors.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            style={{ transition: "stroke-dashoffset 1s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${config.fontSize} font-bold ${colors.text}`}>{score}</span>
          <span className={`${config.subSize} text-muted-foreground`}>/ 100</span>
        </div>
      </div>
      {label && <span className="text-sm font-medium text-muted-foreground">{label}</span>}
    </div>
  )
}

// Style 2: Horizontal Bar
function BarScore({ score, size, label }: Omit<ScoreWidgetProps, "style">) {
  const colors = getScoreColor(score)
  const heights = { sm: "h-2", md: "h-3", lg: "h-4" }
  const widths = { sm: "w-32", md: "w-48", lg: "w-64" }
  const textSizes = { sm: "text-lg", md: "text-2xl", lg: "text-3xl" }

  return (
    <div className="flex flex-col gap-3">
      {label && <span className="text-sm font-medium text-muted-foreground">{label}</span>}
      <div className="flex items-center gap-4">
        <span className={`${textSizes[size ?? "lg"]} font-bold ${colors.text}`}>{score}</span>
        <div className={`${widths[size ?? "lg"]} ${heights[size ?? "lg"]} overflow-hidden rounded-full bg-muted`}>
          <div
            className={`h-full ${colors.bg} rounded-full transition-all duration-1000 ease-out`}
            style={{ width: `${score}%` }}
          />
        </div>
        <span className="text-sm text-muted-foreground">/ 100</span>
      </div>
    </div>
  )
}

// Style 3: Semicircle Gauge
function GaugeScore({ score, size, label }: Omit<ScoreWidgetProps, "style">) {
  const config = getSizeConfig(size ?? "lg")
  const colors = getScoreColor(score)
  const rotation = (score / 100) * 180 - 90

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: config.dimension, height: config.dimension / 2 + 20 }}>
        <svg width={config.dimension} height={config.dimension / 2 + 20} className="overflow-visible">
          {/* Background arc */}
          <path
            d={`M ${config.strokeWidth} ${config.dimension / 2} A ${config.dimension / 2 - config.strokeWidth} ${config.dimension / 2 - config.strokeWidth} 0 0 1 ${config.dimension - config.strokeWidth} ${config.dimension / 2}`}
            fill="none"
            strokeWidth={config.strokeWidth}
            className="stroke-muted"
            strokeLinecap="round"
          />
          {/* Progress arc */}
          <path
            d={`M ${config.strokeWidth} ${config.dimension / 2} A ${config.dimension / 2 - config.strokeWidth} ${config.dimension / 2 - config.strokeWidth} 0 0 1 ${config.dimension - config.strokeWidth} ${config.dimension / 2}`}
            fill="none"
            strokeWidth={config.strokeWidth}
            className={colors.stroke}
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * Math.PI * (config.dimension / 2 - config.strokeWidth)} 1000`}
            style={{ transition: "stroke-dasharray 1s ease-out" }}
          />
          {/* Needle */}
          <g
            transform={`translate(${config.dimension / 2}, ${config.dimension / 2})`}
            style={{ transition: "transform 1s ease-out" }}
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2={-(config.dimension / 2 - config.strokeWidth - 10)}
              strokeWidth="3"
              strokeLinecap="round"
              className="stroke-foreground"
              transform={`rotate(${rotation})`}
            />
            <circle r="6" className="fill-foreground" />
          </g>
        </svg>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
          <span className={`${config.fontSize} font-bold ${colors.text}`}>{score}</span>
        </div>
      </div>
      {label && <span className="text-sm font-medium text-muted-foreground">{label}</span>}
    </div>
  )
}

// Style 4: Large Numeric
function NumericScore({ score, size, label }: Omit<ScoreWidgetProps, "style">) {
  const colors = getScoreColor(score)
  const textSizes = { sm: "text-4xl", md: "text-6xl", lg: "text-8xl" }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-baseline gap-2">
        <span className={`${textSizes[size ?? "lg"]} font-bold tracking-tight ${colors.text}`}>
          {score}
        </span>
        <span className="text-2xl text-muted-foreground">/ 100</span>
      </div>
      {label && <span className="text-sm font-medium text-muted-foreground">{label}</span>}
      <div className="mt-2 flex items-center gap-2">
        <div className={`h-3 w-3 rounded-full ${colors.bg}`} />
        <span className="text-sm capitalize">
          {score >= 80 ? "Excellent" : score >= 50 ? "Needs Work" : "Critical"}
        </span>
      </div>
    </div>
  )
}

// Style 5: Radial Gradient
function RadialScore({ score, size, label }: Omit<ScoreWidgetProps, "style">) {
  const config = getSizeConfig(size ?? "lg")
  const colors = getScoreColor(score)

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative flex items-center justify-center rounded-full"
        style={{
          width: config.dimension,
          height: config.dimension,
          background: `conic-gradient(from 180deg, var(--${score >= 80 ? "accent" : score >= 50 ? "warning" : "destructive"}) ${score * 3.6}deg, var(--muted) ${score * 3.6}deg)`,
        }}
      >
        <div
          className="flex flex-col items-center justify-center rounded-full bg-card"
          style={{
            width: config.dimension - config.strokeWidth * 4,
            height: config.dimension - config.strokeWidth * 4,
          }}
        >
          <span className={`${config.fontSize} font-bold ${colors.text}`}>{score}</span>
          <span className={`${config.subSize} text-muted-foreground`}>points</span>
        </div>
      </div>
      {label && <span className="text-sm font-medium text-muted-foreground">{label}</span>}
    </div>
  )
}
