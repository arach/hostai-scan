"use client"

import { useEffect, useState, useId } from "react"
import { cn } from "@/lib/utils"

interface PublicScoreGaugeProps {
  score: number
  maxScore?: number
  size?: "sm" | "md" | "lg" | "xl"
  animated?: boolean
  showLabel?: boolean
  label?: string
  className?: string
}

function getScoreColor(score: number): { stroke: string; text: string; bg: string; label: string } {
  if (score >= 80) return {
    stroke: "#10b981", // emerald-500
    text: "#059669",   // emerald-600
    bg: "#d1fae5",     // emerald-100
    label: "Excellent"
  }
  if (score >= 50) return {
    stroke: "#f59e0b", // amber-500
    text: "#d97706",   // amber-600
    bg: "#fef3c7",     // amber-100
    label: "Needs Work"
  }
  return {
    stroke: "#f43f5e", // rose-500
    text: "#e11d48",   // rose-600
    bg: "#ffe4e6",     // rose-100
    label: "Needs Urgent Attention"
  }
}

const sizeConfig = {
  sm: { dimension: 100, strokeWidth: 8, fontSize: 24, labelSize: 10, gapAngle: 60 },
  md: { dimension: 140, strokeWidth: 10, fontSize: 36, labelSize: 11, gapAngle: 60 },
  lg: { dimension: 180, strokeWidth: 12, fontSize: 48, labelSize: 12, gapAngle: 60 },
  xl: { dimension: 220, strokeWidth: 14, fontSize: 56, labelSize: 13, gapAngle: 60 },
}

export function PublicScoreGauge({
  score,
  maxScore = 100,
  size = "lg",
  animated = true,
  showLabel = true,
  label,
  className,
}: PublicScoreGaugeProps) {
  const [animatedProgress, setAnimatedProgress] = useState(animated ? 0 : score / maxScore)
  const [displayScore, setDisplayScore] = useState(animated ? 0 : score)
  const instanceId = useId()
  const config = sizeConfig[size]
  const colors = getScoreColor(score)

  // Animate on mount using stroke-dashoffset technique
  useEffect(() => {
    if (!animated) {
      setAnimatedProgress(score / maxScore)
      setDisplayScore(score)
      return
    }

    const duration = 1500
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)

      setAnimatedProgress(eased * (score / maxScore))
      setDisplayScore(Math.round(eased * score))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [score, maxScore, animated])

  const radius = (config.dimension - config.strokeWidth) / 2
  const center = config.dimension / 2

  // Arc calculations - we want a gap at the bottom
  const gapAngle = config.gapAngle // degrees
  const startAngle = 90 + gapAngle / 2 // Start from bottom-left
  const endAngle = 450 - gapAngle / 2 // End at bottom-right
  const totalAngle = endAngle - startAngle // Total arc angle (300 degrees)

  // Convert angles to radians for path calculations
  const startRad = (startAngle * Math.PI) / 180
  const endRad = (endAngle * Math.PI) / 180

  // Calculate the arc path endpoints
  const startX = center + radius * Math.cos(startRad)
  const startY = center + radius * Math.sin(startRad)
  const endX = center + radius * Math.cos(endRad)
  const endY = center + radius * Math.sin(endRad)

  // Large arc flag (always 1 since our arc is > 180 degrees)
  const largeArcFlag = totalAngle > 180 ? 1 : 0

  // The full arc path (used for both background and progress)
  const arcPath = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`

  // Calculate arc length for stroke-dasharray
  const arcLength = (totalAngle / 360) * 2 * Math.PI * radius

  // Stroke dashoffset: full length = hidden, 0 = fully visible
  // We animate from arcLength (hidden) to arcLength * (1 - progress) (revealed)
  const dashOffset = arcLength * (1 - animatedProgress)

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div
        className="relative"
        style={{ width: config.dimension, height: config.dimension }}
      >
        <svg
          width={config.dimension}
          height={config.dimension}
          viewBox={`0 0 ${config.dimension} ${config.dimension}`}
        >
          {/* Glow filter */}
          <defs>
            <filter id={`glow-${instanceId}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id={`gradient-${instanceId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.stroke} stopOpacity="1" />
              <stop offset="100%" stopColor={colors.stroke} stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Background arc */}
          <path
            d={arcPath}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
          />

          {/* Progress arc - uses stroke-dasharray for smooth animation */}
          <path
            d={arcPath}
            fill="none"
            stroke={`url(#gradient-${instanceId})`}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset={dashOffset}
            filter={`url(#glow-${instanceId})`}
            style={{ transition: animated ? 'none' : 'stroke-dashoffset 0.3s ease-out' }}
          />

          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const tickAngle = startAngle + (tick / 100) * totalAngle
            const tickRad = (tickAngle * Math.PI) / 180
            const innerRadius = radius - config.strokeWidth / 2 - 4
            const outerRadius = radius - config.strokeWidth / 2 - 8
            const x1 = center + innerRadius * Math.cos(tickRad)
            const y1 = center + innerRadius * Math.sin(tickRad)
            const x2 = center + outerRadius * Math.cos(tickRad)
            const y2 = center + outerRadius * Math.sin(tickRad)

            return (
              <line
                key={tick}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#d1d5db"
                strokeWidth={1.5}
                strokeLinecap="round"
              />
            )
          })}
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-bold leading-none tracking-tight"
            style={{
              fontSize: config.fontSize,
              color: colors.text,
            }}
          >
            {displayScore}
          </span>
          <span
            className="font-medium mt-1"
            style={{
              fontSize: config.labelSize,
              color: "#9ca3af",
            }}
          >
            out of {maxScore}
          </span>
        </div>
      </div>

      {/* Label below gauge */}
      {showLabel && (
        <div
          className="mt-3 px-3 py-1 rounded-full font-medium"
          style={{
            fontSize: config.labelSize + 1,
            backgroundColor: colors.bg,
            color: colors.text,
          }}
        >
          {label || colors.label}
        </div>
      )}
    </div>
  )
}
