import { useEffect, useState } from "react"

interface AuditScannerProps {
  progress: number
  currentCheck: string
}

export function AuditScanner({ progress, currentCheck }: AuditScannerProps) {
  const [rotation, setRotation] = useState(0)
  const [pulseScale, setPulseScale] = useState(1)
  const [dataPoints, setDataPoints] = useState<{ x: number; y: number; opacity: number }[]>([])

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => (prev + 2) % 360)
      setPulseScale((prev) => (prev === 1 ? 1.05 : 1))
    }, 50)
    return () => clearInterval(interval)
  }, [])

  // Generate random data points for the "scanning" effect
  useEffect(() => {
    const interval = setInterval(() => {
      setDataPoints((prev) => {
        const newPoints = [...prev]
        // Add a new point
        if (newPoints.length < 12) {
          const angle = Math.random() * Math.PI * 2
          const radius = 60 + Math.random() * 30
          newPoints.push({
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
            opacity: 1,
          })
        }
        // Fade out existing points
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
      {/* Outer glow */}
      <div 
        className="absolute h-52 w-52 rounded-full bg-accent/10 blur-2xl"
        style={{ transform: `scale(${pulseScale})`, transition: "transform 0.5s ease" }}
      />
      
      <svg width="200" height="200" viewBox="0 0 200 200" className="relative z-10">
        <defs>
          {/* Gradient for the progress ring */}
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-accent)" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.5" />
          </linearGradient>
          
          {/* Gradient for scanner beam */}
          <linearGradient id="scannerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--color-accent)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Background circles */}
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.5"
        />
        <circle
          cx="100"
          cy="100"
          r="70"
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.3"
        />
        <circle
          cx="100"
          cy="100"
          r="50"
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="1"
          opacity="0.2"
        />

        {/* Progress track */}
        <circle
          cx="100"
          cy="100"
          r="45"
          fill="none"
          stroke="var(--color-muted)"
          strokeWidth="6"
          opacity="0.3"
        />

        {/* Progress ring */}
        <circle
          cx="100"
          cy="100"
          r="45"
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 100 100)"
          filter="url(#glow)"
          style={{ transition: "stroke-dashoffset 0.3s ease" }}
        />

        {/* Rotating scanner lines */}
        <g transform={`rotate(${rotation} 100 100)`}>
          {/* Main scanner beam */}
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="15"
            stroke="var(--color-accent)"
            strokeWidth="2"
            opacity="0.6"
            filter="url(#glow)"
          />
          {/* Secondary beams */}
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="25"
            stroke="var(--color-accent)"
            strokeWidth="1"
            opacity="0.3"
            transform="rotate(120 100 100)"
          />
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="25"
            stroke="var(--color-accent)"
            strokeWidth="1"
            opacity="0.3"
            transform="rotate(240 100 100)"
          />
        </g>

        {/* Scanner sweep arc */}
        <path
          d={`M 100 100 L 100 15 A 85 85 0 0 1 ${100 + 85 * Math.sin(Math.PI / 6)} ${100 - 85 * Math.cos(Math.PI / 6)} Z`}
          fill="url(#scannerGradient)"
          opacity="0.15"
          transform={`rotate(${rotation} 100 100)`}
        />

        {/* Data points being "scanned" */}
        {dataPoints.map((point, i) => (
          <circle
            key={i}
            cx={100 + point.x}
            cy={100 + point.y}
            r="3"
            fill="var(--color-accent)"
            opacity={point.opacity}
            filter="url(#glow)"
          />
        ))}

        {/* Center hub */}
        <circle
          cx="100"
          cy="100"
          r="20"
          fill="var(--color-card)"
          stroke="var(--color-border)"
          strokeWidth="2"
        />
        <circle
          cx="100"
          cy="100"
          r="8"
          fill="var(--color-accent)"
          opacity="0.8"
          filter="url(#glow)"
        >
          <animate
            attributeName="r"
            values="6;10;6"
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.8;0.4;0.8"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Percentage text */}
        <text
          x="100"
          y="106"
          textAnchor="middle"
          className="fill-foreground text-lg font-bold"
          style={{ fontSize: "18px" }}
        >
          {progress}%
        </text>
      </svg>

      {/* Current action label */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-lg border border-border">
        {currentCheck}
      </div>
    </div>
  )
}
