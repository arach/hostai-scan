"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { AuditPhase, ScannerProgress } from "./types"
import { getPhaseTimings } from "./phases"

interface UseScannerProgressOptions {
  /** Total duration in milliseconds (default: 60000 = 60s) */
  totalDuration?: number
  /** Phases to run through */
  phases: AuditPhase[]
  /** Auto-start on mount */
  autoStart?: boolean
  /** Called when scan completes */
  onComplete?: () => void
  /** Update interval in ms (default: 100) */
  updateInterval?: number
}

export function useScannerProgress({
  totalDuration = 60000,
  phases,
  autoStart = false,
  onComplete,
  updateInterval = 100,
}: UseScannerProgressOptions) {
  const [isRunning, setIsRunning] = useState(autoStart)
  const [progress, setProgress] = useState<ScannerProgress>({
    currentPhase: 0,
    phaseProgress: 0,
    overallProgress: 0,
    isComplete: false,
    statusMessage: phases[0]?.description || "Initializing...",
  })

  const startTimeRef = useRef<number | null>(null)
  const phaseTimings = getPhaseTimings(phases, totalDuration)

  // Calculate progress based on elapsed time
  // Each phase reserves 15% of its duration as a "hold" period at 100%
  const HOLD_RATIO = 0.15

  const updateProgress = useCallback(() => {
    if (!startTimeRef.current) return

    const elapsed = Date.now() - startTimeRef.current
    const overallProgress = Math.min(100, (elapsed / totalDuration) * 100)

    // Find current phase
    let currentPhaseIndex = 0
    let phaseProgress = 0

    for (let i = 0; i < phaseTimings.length; i++) {
      const timing = phaseTimings[i]
      if (elapsed >= timing.startMs && elapsed < timing.endMs) {
        currentPhaseIndex = i

        // Calculate progress with hold period
        const phaseElapsed = elapsed - timing.startMs
        const workDuration = timing.durationMs * (1 - HOLD_RATIO) // Time for 0-100%
        const holdStart = workDuration // When hold begins

        if (phaseElapsed >= holdStart) {
          // In hold period - stay at 100%
          phaseProgress = 100
        } else {
          // Still working - scale to fill 0-100% in workDuration
          phaseProgress = (phaseElapsed / workDuration) * 100
        }
        break
      } else if (elapsed >= timing.endMs) {
        currentPhaseIndex = i
        phaseProgress = 100
      }
    }

    const isComplete = elapsed >= totalDuration

    setProgress({
      currentPhase: currentPhaseIndex,
      phaseProgress: Math.min(100, Math.round(phaseProgress)),
      overallProgress: Math.round(overallProgress),
      isComplete,
      statusMessage: phases[currentPhaseIndex]?.description || "Processing...",
    })

    if (isComplete) {
      setIsRunning(false)
      onComplete?.()
    }
  }, [phases, phaseTimings, totalDuration, onComplete])

  // Run the timer
  useEffect(() => {
    if (!isRunning) return

    if (!startTimeRef.current) {
      startTimeRef.current = Date.now()
    }

    const interval = setInterval(updateProgress, updateInterval)
    return () => clearInterval(interval)
  }, [isRunning, updateProgress, updateInterval])

  // Control functions
  const start = useCallback(() => {
    startTimeRef.current = Date.now()
    setProgress({
      currentPhase: 0,
      phaseProgress: 0,
      overallProgress: 0,
      isComplete: false,
      statusMessage: phases[0]?.description || "Initializing...",
    })
    setIsRunning(true)
  }, [phases])

  const pause = useCallback(() => {
    setIsRunning(false)
  }, [])

  const resume = useCallback(() => {
    setIsRunning(true)
  }, [])

  const reset = useCallback(() => {
    startTimeRef.current = null
    setIsRunning(false)
    setProgress({
      currentPhase: 0,
      phaseProgress: 0,
      overallProgress: 0,
      isComplete: false,
      statusMessage: phases[0]?.description || "Initializing...",
    })
  }, [phases])

  return {
    progress,
    isRunning,
    start,
    pause,
    resume,
    reset,
  }
}
