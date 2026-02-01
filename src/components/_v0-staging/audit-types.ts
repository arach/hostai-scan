export interface AuditResult {
  id: string
  domain: string
  createdAt: string
  expiresAt: string
  overallScore: number
  categories: AuditCategory[]
  quickWins: QuickWin[]
  issues: AuditIssue[]
  metadata: AuditMetadata
}

export interface AuditCategory {
  id: string
  name: string
  score: number
  maxScore: number
  status: "good" | "warning" | "critical"
  description: string
  issueCount: number
}

export interface QuickWin {
  id: string
  title: string
  description: string
  impact: "high" | "medium" | "low"
  effort: "low" | "medium" | "high"
  category: string
}

export interface AuditIssue {
  id: string
  category: string
  severity: "critical" | "warning" | "info"
  title: string
  description: string
  impact: string
  howToFix: string
  learnMoreUrl?: string
}

export interface AuditMetadata {
  url: string
  title?: string
  description?: string
  screenshot?: string
  loadTime?: number
  mobileScore?: number
  desktopScore?: number
  sslValid?: boolean
  hasBookingCTA?: boolean
  hasReviews?: boolean
}

export interface AuditProgress {
  stage: "initializing" | "fetching" | "analyzing" | "scoring" | "complete" | "error"
  progress: number
  message: string
  completedChecks: string[]
}

// API check result types
export interface PerformanceData {
  score: number
  metrics: {
    lcp?: number
    fid?: number
    cls?: number
    ttfb?: number
    fcp?: number
  }
  issues: AuditIssue[]
}

export interface SEOData {
  score: number
  hasTitle: boolean
  hasDescription: boolean
  hasH1: boolean
  hasCanonical: boolean
  hasStructuredData: boolean
  issues: AuditIssue[]
}

export interface TrustData {
  score: number
  hasSSL: boolean
  hasReviews: boolean
  hasContactInfo: boolean
  hasSocialProof: boolean
  issues: AuditIssue[]
}

export interface MobileData {
  score: number
  isResponsive: boolean
  hasTouchTargets: boolean
  hasViewport: boolean
  issues: AuditIssue[]
}

export interface ConversionData {
  score: number
  hasBookingCTA: boolean
  hasPricing: boolean
  hasAvailability: boolean
  hasGallery: boolean
  issues: AuditIssue[]
}
