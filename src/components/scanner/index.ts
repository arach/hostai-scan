// Scanner Module
// Beautiful, animated scanner components for the GetHost.AI audit flow

// Types
export type { AuditPhase, ScannerProgress, ScannerConfig } from "./types"

// Phase definitions
export { DEFAULT_PHASES, getPhase, getPhaseTimings } from "./phases"

// Hook for managing scanner progress
export { useScannerProgress } from "./use-scanner-progress"

// Main multi-phase scanner (full-page experience)
export { MultiPhaseScanner } from "./multi-phase-scanner"

// Portable radar scanner (compact, floatable)
export { PortableScanner, FloatingScannerContainer } from "./portable-scanner"
