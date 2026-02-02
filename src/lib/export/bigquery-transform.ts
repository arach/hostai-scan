/**
 * Transform AuditResult into BigQuery-compatible row objects
 *
 * Category names are matched case-insensitively. Expected values:
 * - "Performance", "SEO", "Conversion", "Trust", "Content"
 */

import type { AuditResult, AuditCategory, AuditRecommendation } from "@/types/audit";

// BigQuery row types
export interface AuditRow {
  audit_id: string;
  domain: string;
  timestamp: string;
  overall_score: number;
  projected_score: number | null;
  monthly_revenue_loss: number | null;
  summary: string | null;

  // Category scores
  performance_score: number | null;
  seo_score: number | null;
  conversion_score: number | null;
  trust_score: number | null;
  content_score: number | null;

  // Core Web Vitals (FID deprecated March 2024, INP is successor)
  lcp_ms: number | null;
  lcp_category: string | null;
  fid_ms: number | null; // deprecated, kept for historical data
  fid_category: string | null;
  inp_ms: number | null; // Interaction to Next Paint (replaces FID)
  inp_category: string | null;
  cls_score: number | null;
  cls_category: string | null;
  fcp_ms: number | null;
  fcp_category: string | null;

  // Lighthouse
  lighthouse_performance: number | null;
  lighthouse_accessibility: number | null;
  lighthouse_best_practices: number | null;
  lighthouse_seo: number | null;

  // SEO Metrics
  organic_traffic: number | null;
  organic_keywords: number | null;
  backlinks: number | null;
  domain_rank: number | null;
  authority_score: number | null;

  // Booking Flow
  has_booking_cta: boolean | null;
  cta_text: string | null;
  cta_location: string | null;
  booking_engine_name: string | null;
  booking_engine_type: string | null;
  has_date_picker: boolean | null;
  has_instant_book: boolean | null;
  clicks_to_book: number | null;
  friction_score: number | null;

  // Trust Signals
  trust_score_overall: number | null;
  has_reviews: boolean | null;
  review_count: number | null;
  average_rating: number | null;
  has_phone: boolean | null;
  has_email: boolean | null;
  has_address: boolean | null;
  has_privacy_policy: boolean | null;

  // Metadata
  fetch_time_ms: number | null;
  url: string | null;
  inserted_at: string;
}

export interface RecommendationRow {
  audit_id: string;
  title: string;
  description: string | null;
  status: string;
  impact: string;
  category: string;
  inserted_at: string;
}

export interface CategoryRow {
  audit_id: string;
  name: string;
  score: number;
  weight: number;
  description: string | null;
  source: string | null;
  inserted_at: string;
}

export interface BigQueryRows {
  audit: AuditRow;
  recommendations: RecommendationRow[];
  categories: CategoryRow[];
}

/**
 * Transform an AuditResult into all BigQuery rows
 */
export function transformAuditToBigQueryRows(audit: AuditResult): BigQueryRows {
  const insertedAt = new Date().toISOString();
  const auditId = audit.auditId || `${audit.domain}-${Date.now()}`;

  return {
    audit: transformAuditRow(audit, auditId, insertedAt),
    recommendations: transformRecommendations(audit.recommendations, auditId, insertedAt),
    categories: transformCategories(audit.categories, auditId, insertedAt),
  };
}

function getCategoryScore(categories: AuditCategory[], name: string): number | null {
  const category = categories.find(
    (c) => c.name.toLowerCase() === name.toLowerCase()
  );
  return category?.score ?? null;
}

function transformAuditRow(
  audit: AuditResult,
  auditId: string,
  insertedAt: string
): AuditRow {
  const { coreWebVitals, lighthouseScores, seoMetrics, bookingFlow, trustSignals, meta } =
    audit;

  return {
    audit_id: auditId,
    domain: audit.domain,
    timestamp: audit.timestamp,
    overall_score: audit.overallScore,
    projected_score: audit.projectedScore ?? null,
    monthly_revenue_loss: audit.monthlyRevenueLoss ?? null,
    summary: audit.summary ?? null,

    // Category scores
    performance_score: getCategoryScore(audit.categories, "Performance"),
    seo_score: getCategoryScore(audit.categories, "SEO"),
    conversion_score: getCategoryScore(audit.categories, "Conversion"),
    trust_score: getCategoryScore(audit.categories, "Trust"),
    content_score: getCategoryScore(audit.categories, "Content"),

    // Core Web Vitals
    lcp_ms: coreWebVitals?.LARGEST_CONTENTFUL_PAINT_MS?.percentile ?? null,
    lcp_category: coreWebVitals?.LARGEST_CONTENTFUL_PAINT_MS?.category ?? null,
    fid_ms: coreWebVitals?.FIRST_INPUT_DELAY_MS?.percentile ?? null,
    fid_category: coreWebVitals?.FIRST_INPUT_DELAY_MS?.category ?? null,
    inp_ms: (coreWebVitals as Record<string, { percentile?: number; category?: string } | undefined>)?.INTERACTION_TO_NEXT_PAINT_MS?.percentile ?? null,
    inp_category: (coreWebVitals as Record<string, { percentile?: number; category?: string } | undefined>)?.INTERACTION_TO_NEXT_PAINT_MS?.category ?? null,
    cls_score: coreWebVitals?.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile ?? null,
    cls_category: coreWebVitals?.CUMULATIVE_LAYOUT_SHIFT_SCORE?.category ?? null,
    fcp_ms: coreWebVitals?.FIRST_CONTENTFUL_PAINT_MS?.percentile ?? null,
    fcp_category: coreWebVitals?.FIRST_CONTENTFUL_PAINT_MS?.category ?? null,

    // Lighthouse
    lighthouse_performance: lighthouseScores?.performance?.score ?? null,
    lighthouse_accessibility: lighthouseScores?.accessibility?.score ?? null,
    lighthouse_best_practices: lighthouseScores?.["best-practices"]?.score ?? null,
    lighthouse_seo: lighthouseScores?.seo?.score ?? null,

    // SEO Metrics
    organic_traffic: seoMetrics?.organic_traffic ?? null,
    organic_keywords: seoMetrics?.organic_keywords ?? null,
    backlinks: seoMetrics?.backlinks ?? null,
    domain_rank: seoMetrics?.domain_rank ?? null,
    authority_score: seoMetrics?.authority_score ?? null,

    // Booking Flow
    has_booking_cta: bookingFlow?.hasBookingCTA ?? null,
    cta_text: bookingFlow?.ctaText ?? null,
    cta_location: bookingFlow?.ctaLocation ?? null,
    booking_engine_name: bookingFlow?.bookingEngine?.name ?? null,
    booking_engine_type: bookingFlow?.bookingEngine?.type ?? null,
    has_date_picker: bookingFlow?.hasDatePicker ?? null,
    has_instant_book: bookingFlow?.hasInstantBook ?? null,
    clicks_to_book: bookingFlow?.estimatedClicksToBook ?? null,
    friction_score: bookingFlow?.frictionScore ?? null,

    // Trust Signals
    trust_score_overall: trustSignals?.overallTrustScore ?? null,
    has_reviews: trustSignals?.hasReviews ?? null,
    review_count: trustSignals?.reviewCount ?? null,
    average_rating: trustSignals?.averageRating ?? null,
    has_phone: trustSignals?.hasPhoneNumber ?? null,
    has_email: trustSignals?.hasEmailAddress ?? null,
    has_address: trustSignals?.hasPhysicalAddress ?? null,
    has_privacy_policy: trustSignals?.hasPrivacyPolicy ?? null,

    // Metadata
    fetch_time_ms: meta?.fetchTimeMs ?? null,
    url: meta?.url ?? null,
    inserted_at: insertedAt,
  };
}

function transformRecommendations(
  recommendations: AuditRecommendation[],
  auditId: string,
  insertedAt: string
): RecommendationRow[] {
  return recommendations.map((rec) => ({
    audit_id: auditId,
    title: rec.title,
    description: rec.description ?? null,
    status: rec.status,
    impact: rec.impact,
    category: rec.category,
    inserted_at: insertedAt,
  }));
}

function transformCategories(
  categories: AuditCategory[],
  auditId: string,
  insertedAt: string
): CategoryRow[] {
  return categories.map((cat) => ({
    audit_id: auditId,
    name: cat.name,
    score: cat.score,
    weight: cat.weight,
    description: cat.description ?? null,
    source: cat.source ?? null,
    inserted_at: insertedAt,
  }));
}
