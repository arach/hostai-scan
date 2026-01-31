export interface AuditCategory {
  name: string;
  score: number;
  weight: number;
  description: string;
  source?: string;
}

export interface AuditRecommendation {
  title: string;
  description: string;
  status: "pass" | "fail" | "warning";
  impact: "High" | "Medium" | "Low";
  category: string;
}

export interface Competitor {
  name: string;
  rating: number;
  rank: number;
}

export interface CoreWebVitals {
  LARGEST_CONTENTFUL_PAINT_MS?: { percentile: number; category: string };
  FIRST_INPUT_DELAY_MS?: { percentile: number; category: string };
  CUMULATIVE_LAYOUT_SHIFT_SCORE?: { percentile: number; category: string };
  FIRST_CONTENTFUL_PAINT_MS?: { percentile: number; category: string };
}

export interface LighthouseScores {
  performance?: { score: number };
  accessibility?: { score: number };
  "best-practices"?: { score: number };
  seo?: { score: number };
}

export interface SEOMetrics {
  organic_traffic?: number;
  organic_keywords?: number;
  backlinks?: number;
  domain_rank?: number;
  authority_score?: number;
}

export interface BookingFlowData {
  hasBookingCTA: boolean;
  ctaText: string | null;
  ctaLocation: "above-fold" | "below-fold" | "none";
  bookingEngine: {
    name: string;
    type: "embedded" | "redirect" | "native";
    confidence: number;
  } | null;
  hasDatePicker: boolean;
  hasInstantBook: boolean;
  estimatedClicksToBook: number;
  frictionScore: number;
}

export interface TrustSignalsData {
  overallTrustScore: number;
  hasReviews: boolean;
  reviewSource: {
    name: string;
    type: string;
    isVerified: boolean;
  } | null;
  reviewCount: number | null;
  averageRating: number | null;
  trustBadges: Array<{ name: string; category: string }>;
  hasPhoneNumber: boolean;
  hasEmailAddress: boolean;
  hasPhysicalAddress: boolean;
  hasSocialProfiles: Array<{ platform: string; detected: boolean }>;
  hasPrivacyPolicy: boolean;
}

export interface AuditResult {
  domain: string;
  timestamp: string;
  overallScore: number;
  projectedScore: number;
  monthlyRevenueLoss: number;
  summary: string;
  categories: AuditCategory[];
  recommendations: AuditRecommendation[];
  competitors: Competitor[];
  // Persisted audit ID for shareable URLs
  auditId?: string;
  // Extended data from APIs
  coreWebVitals?: CoreWebVitals | null;
  lighthouseScores?: LighthouseScores | null;
  seoMetrics?: SEOMetrics | null;
  // STR-specific analysis
  bookingFlow?: BookingFlowData;
  trustSignals?: TrustSignalsData;
  meta?: {
    fetchTimeMs: number;
    url: string;
    dataSourcesUsed?: {
      htmlAnalysis?: boolean;
      pageSpeed: boolean;
      semrush: boolean;
      bookingFlowAnalysis?: boolean;
      trustSignalAnalysis?: boolean;
    };
    notes?: string[];
  };
}
