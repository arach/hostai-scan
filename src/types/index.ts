// Core types
export type Strategy = "mobile" | "desktop";
export type AuditStatus = "pending" | "complete" | "partial" | "error";
export type ScoreCategory = "conversion" | "performance" | "trust" | "content" | "seo" | "security";
export type Severity = "blocker" | "major" | "minor" | "trivial";
export type Effort = "low" | "medium" | "high";

// Audit Request
export interface AuditRequest {
  auditId: string;
  domain: string;
  startedAt: string;
  campaign?: {
    id: string;
    source?: string;
    initiatorId?: string;
  };
  pages: AuditPageTarget[];
}

export interface AuditPageTarget {
  url: string;
  kind: "home" | "property" | "booking" | "location" | "other";
}

// Lead signals for sales prioritization
export interface LeadSignals {
  domainAuthority?: number;
  estimatedPropertyCount?: number;
  currentBookingEngine?: string;
  hasCustomDomain: boolean;
  techSophistication: "low" | "medium" | "high";
  campaignSource?: string;
  leadScore: number;
}

// Normalized Audit (main output)
export interface NormalizedAudit {
  auditId: string;
  domain: string;
  status: AuditStatus;
  generatedAt: string;
  inputs: AuditRequest;

  perf?: PerformanceSignals;
  crawl?: CrawlSignals;
  tech?: TechSignals;
  seo?: SeoSignals;
  trust?: TrustSignals;
  security?: SecuritySignals;
  content?: ContentSignals;

  artifacts?: AuditArtifacts;
  scoring?: ScoringOutput;
  errors?: ModuleError[];
}

export interface ModuleError {
  module: "pagespeed" | "crawl" | "tech" | "seo" | "trust" | "security" | "browserbase";
  severity: "warn" | "error";
  message: string;
  retriable: boolean;
}

// Performance Signals
export interface PerformanceSignals {
  byStrategy: Record<Strategy, LighthouseResult | undefined>;
}

export interface LighthouseResult {
  fetchedAt: string;
  url: string;
  categoryScore: {
    performance?: number;
    accessibility?: number;
    bestPractices?: number;
    seo?: number;
  };
  metrics: {
    lcpMs?: number;
    cls?: number;
    inpMs?: number;
    fcpMs?: number;
    tbtMs?: number;
    speedIndexMs?: number;
  };
  opportunities: LighthouseOpportunity[];
}

export interface LighthouseOpportunity {
  id: string;
  title: string;
  description?: string;
  estimatedSavingsMs?: number;
  estimatedSavingsBytes?: number;
}

// Crawl Signals
export interface CrawlSignals {
  pages: CrawledPage[];
  bookingPath?: BookingPathSignals;
  conversionElements?: ConversionSignals;
}

export interface CrawledPage {
  url: string;
  kind: AuditPageTarget["kind"];
  strategy: Strategy;
  fetchedAt: string;
  screenshotUrl?: string;
  aboveFoldText?: string;
  domHash?: string;
  detectedCTAs: CTAButton[];
  forms: DetectedForm[];
  contacts: ContactSignals;
  policies: PolicySignals;
  trustElements: TrustElementSignals;
  resources: ResourceSummary;
}

export interface CTAButton {
  label: string;
  href?: string;
  isPrimaryGuess: boolean;
  positionHint?: "above_fold" | "below_fold" | "unknown";
}

export interface DetectedForm {
  kind: "booking" | "inquiry" | "newsletter" | "contact" | "unknown";
  fields: string[];
  submitLabel?: string;
}

export interface ContactSignals {
  hasPhone: boolean;
  hasEmail: boolean;
  hasAddress: boolean;
  hasLiveChat: boolean;
}

export interface PolicySignals {
  hasCancellationPolicy: boolean;
  hasHouseRules: boolean;
  hasPrivacyPolicy: boolean;
  hasTerms: boolean;
  policyLinks?: string[];
}

export interface TrustElementSignals {
  hasReviewsSection: boolean;
  hasThirdPartyReviewBadges: boolean;
  hasSecurePaymentBadges: boolean;
  hasSocialProofMentions: boolean;
}

export interface ResourceSummary {
  totalRequests?: number;
  totalBytes?: number;
  thirdPartyRequests?: number;
  thirdPartyBytes?: number;
  hasCookieBannerBlockingUI?: boolean;
}

export interface BookingPathSignals {
  steps: Array<{
    url: string;
    kind: "availability" | "booking_start" | "checkout" | "confirmation" | "unknown";
    success: boolean;
    frictionNotes?: string[];
  }>;
  clickDepthFromHome?: number;
  crossDomain?: boolean;
  crossDomainHost?: string;
}

export interface ConversionSignals {
  hasPersistentBookingCTAOnMobile?: boolean;
  showsFeesBeforeCheckout?: boolean;
  showsCancellationBeforeCheckout?: boolean;
  requiresAccountCreation?: boolean;
  supportsInstantBooking?: boolean;
  hasInquiryFallback?: boolean;
}

// Content Signals
export interface ContentSignals {
  imageCount?: number;
  heroImageWidth?: number;
  hasVideo?: boolean;
  descriptionWordCount?: number;
  hasDirectBookingBenefits?: boolean;
  hasLocalAreaContent?: boolean;
  reviewCount?: number;
  mostRecentReviewDate?: string;
}

// Tech Signals
export interface TechSignals {
  cms?: string;
  frameworks?: string[];
  cdn?: string;
  analytics: {
    hasGA4: boolean;
    hasGTM: boolean;
    hasMetaPixel: boolean;
    hasGoogleAdsTag: boolean;
  };
  bookingEngine?: {
    provider?: string;
    embedded?: boolean;
    separateDomain?: boolean;
  };
  chatWidget?: string;
}

// SEO Signals
export interface SeoSignals {
  indexability?: {
    robotsTxtPresent: boolean;
    sitemapPresent: boolean;
    hasNoindexOnMoneyPages?: boolean;
  };
  meta?: {
    missingTitlesCount?: number;
    duplicateTitlesCount?: number;
    missingDescriptionsCount?: number;
  };
  schema?: {
    hasLocalBusiness: boolean;
    hasLodgingBusiness: boolean;
    hasFAQ: boolean;
    hasReview: boolean;
  };
}

// Trust Signals
export interface TrustSignals {
  businessIdentity?: {
    hasCompanyName: boolean;
    matchesDomainNameHint?: boolean;
    hasPhone: boolean;
    hasAddress: boolean;
  };
  reviews?: {
    onSite: { present: boolean; countHint?: number };
    google?: { present: boolean; rating?: number; count?: number };
    airbnbOrVrboBadges?: { present: boolean };
  };
}

// Security Signals
export interface SecuritySignals {
  tls?: {
    hasHttps: boolean;
    mixedContent: boolean;
    sslLabsGrade?: string;
  };
  headers?: {
    hsts?: boolean;
    csp?: boolean;
  };
}

// Session Replay (Browserbase)
export interface SessionReplay {
  strategy: Strategy;
  replayUrl: string;
  videoUrl?: string;
  durationMs: number;
  startedAt: string;
  viewportWidth: number;
  viewportHeight: number;
  markers: ReplayMarker[];
  reachedBooking: boolean;
  blockedReason?: string;
}

export interface ReplayMarker {
  timestampMs: number;
  label: string;
  screenshot?: string;
}

// Lighthouse Artifacts
export interface LighthouseArtifacts {
  strategy: Strategy;
  fetchedAt: string;
  coreWebVitals: {
    lcp: WebVitalMetric;
    cls: WebVitalMetric;
    inp: WebVitalMetric | null;
  };
  filmstrip: FilmstripFrame[];
  treemap?: TreemapData;
  opportunities: LighthouseOpportunity[];
}

export interface WebVitalMetric {
  value: number;
  rating: "good" | "needs-improvement" | "poor";
}

export interface FilmstripFrame {
  timestampMs: number;
  imageUrl: string;
}

export interface TreemapData {
  totalBytes: number;
  unusedBytes: number;
  scripts: Array<{
    url: string;
    totalBytes: number;
    unusedBytes: number;
  }>;
}

// Artifacts
export interface AuditArtifacts {
  screenshots: Array<{
    url: string;
    pageKind: AuditPageTarget["kind"];
    strategy: Strategy;
  }>;
  sessionReplays: SessionReplay[];
  lighthouse: LighthouseArtifacts[];
  raw?: Record<string, unknown>;
}

// Scoring
export interface ScoringOutput {
  overallScore: number;
  projectedScore: number;
  projectedScoreWithProduct: number;
  estimatedImpact: {
    conversionLossPercent: number;
    topContributors: string[];
  };
  categoryScores: Record<ScoreCategory, CategoryScore>;
  topIssues: Finding[];
  fastWins: Finding[];
  generatedAt: string;
  version: string;
}

export interface CategoryScore {
  category: ScoreCategory;
  score: number;
  blockerCount: number;
  findings: Finding[];
}

export interface Finding {
  id: string;
  title: string;
  category: ScoreCategory;
  severity: Severity;
  impact: number;
  confidence: number;
  penalty: number;
  evidence: string[];
  fix: string;
  effort: Effort;
  tags: string[];
}

// Rule type
export type Rule = (audit: NormalizedAudit) => Finding | null;
