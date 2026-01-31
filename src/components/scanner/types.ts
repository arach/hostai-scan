import type { ReactNode } from "react"

export interface AuditPhase {
  id: string
  name: string
  description: string
  icon: ReactNode
  color: string
  /** Simulated file names shown during this phase */
  items: string[]
  /** Weight as percentage of total duration (should sum to 100 across all phases) */
  weight?: number
}

export interface ScannerProgress {
  /** Current phase index (0-based) */
  currentPhase: number
  /** Progress within current phase (0-100) */
  phaseProgress: number
  /** Overall progress across all phases (0-100) */
  overallProgress: number
  /** Whether the scan is complete */
  isComplete: boolean
  /** Current status message */
  statusMessage: string
}

export interface ScannerConfig {
  /** Total duration in milliseconds */
  totalDuration: number
  /** Phases to run through */
  phases: AuditPhase[]
  /** Called when scan completes */
  onComplete?: () => void
  /** Called on progress updates */
  onProgress?: (progress: ScannerProgress) => void
}
