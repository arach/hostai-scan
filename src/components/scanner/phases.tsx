import { Globe, Zap, Search, Eye, Calculator } from "lucide-react"
import type { AuditPhase } from "./types"
import scannerConfig from "@/config/scanner-phases.json"

/**
 * Phase metadata - icons, colors, weights (can't be stored in JSON)
 */
const PHASE_META: Record<string, { icon: React.ReactNode; color: string; weight: number }> = {
  domain: { icon: <Globe className="h-5 w-5" />, color: "accent", weight: 15 },
  performance: { icon: <Zap className="h-5 w-5" />, color: "warning", weight: 25 },
  seo: { icon: <Search className="h-5 w-5" />, color: "accent", weight: 20 },
  ui: { icon: <Eye className="h-5 w-5" />, color: "destructive", weight: 25 },
  scoring: { icon: <Calculator className="h-5 w-5" />, color: "accent", weight: 15 },
}

/**
 * Default audit phases for the GetHost.AI scanner
 * Items are loaded from src/config/scanner-phases.json (editable via /dev/scanner)
 * Icons and weights are defined in code above
 */
export const DEFAULT_PHASES: AuditPhase[] = scannerConfig.phases.map(phase => ({
  id: phase.id,
  name: phase.name,
  description: phase.description,
  items: phase.items,
  ...PHASE_META[phase.id],
}))

/** Get phase by ID */
export function getPhase(id: string): AuditPhase | undefined {
  return DEFAULT_PHASES.find(p => p.id === id)
}

/** Calculate phase boundaries based on weights */
export function getPhaseTimings(phases: AuditPhase[], totalDuration: number) {
  const totalWeight = phases.reduce((sum, p) => sum + (p.weight || 20), 0)
  let accumulated = 0

  return phases.map(phase => {
    const weight = phase.weight || 20
    const start = accumulated
    const duration = (weight / totalWeight) * totalDuration
    accumulated += duration

    return {
      phase,
      startMs: start,
      endMs: accumulated,
      durationMs: duration,
    }
  })
}
