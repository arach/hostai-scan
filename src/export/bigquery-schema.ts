/**
 * BigQuery schema definitions for NormalizedAudit data
 *
 * Tables are normalized to optimize for querying:
 * - audits: Main audit table with flattened scores and metadata
 * - findings: Individual findings (from scoring.categoryScores and topIssues/fastWins)
 * - crawl_pages: Crawled page data
 * - booking_steps: Booking path steps
 * - session_replays: Session replay artifacts
 * - module_errors: Per-module errors
 * - lighthouse_opportunities: Performance opportunities
 */

import type { TableSchema, TableMetadata } from "@google-cloud/bigquery";

// Main audits table - one row per audit
export const auditsSchema: TableSchema = {
  fields: [
    { name: "audit_id", type: "STRING", mode: "REQUIRED" },
    { name: "domain", type: "STRING", mode: "REQUIRED" },
    { name: "status", type: "STRING", mode: "REQUIRED" },
    { name: "generated_at", type: "TIMESTAMP", mode: "REQUIRED" },
    { name: "started_at", type: "TIMESTAMP", mode: "NULLABLE" },

    // Campaign metadata
    { name: "campaign_id", type: "STRING", mode: "NULLABLE" },
    { name: "campaign_source", type: "STRING", mode: "NULLABLE" },
    { name: "initiator_id", type: "STRING", mode: "NULLABLE" },

    // Scoring summary
    { name: "overall_score", type: "INT64", mode: "NULLABLE" },
    { name: "projected_score", type: "INT64", mode: "NULLABLE" },
    { name: "projected_score_with_product", type: "INT64", mode: "NULLABLE" },
    { name: "conversion_loss_percent", type: "FLOAT64", mode: "NULLABLE" },

    // Category scores (flattened)
    { name: "conversion_score", type: "INT64", mode: "NULLABLE" },
    { name: "conversion_blocker_count", type: "INT64", mode: "NULLABLE" },
    { name: "performance_score", type: "INT64", mode: "NULLABLE" },
    { name: "performance_blocker_count", type: "INT64", mode: "NULLABLE" },
    { name: "trust_score", type: "INT64", mode: "NULLABLE" },
    { name: "trust_blocker_count", type: "INT64", mode: "NULLABLE" },
    { name: "seo_score", type: "INT64", mode: "NULLABLE" },
    { name: "seo_blocker_count", type: "INT64", mode: "NULLABLE" },
    { name: "security_score", type: "INT64", mode: "NULLABLE" },
    { name: "security_blocker_count", type: "INT64", mode: "NULLABLE" },
    { name: "content_score", type: "INT64", mode: "NULLABLE" },
    { name: "content_blocker_count", type: "INT64", mode: "NULLABLE" },

    // Performance metrics (mobile)
    { name: "mobile_lcp_ms", type: "INT64", mode: "NULLABLE" },
    { name: "mobile_cls", type: "FLOAT64", mode: "NULLABLE" },
    { name: "mobile_inp_ms", type: "INT64", mode: "NULLABLE" },
    { name: "mobile_fcp_ms", type: "INT64", mode: "NULLABLE" },
    { name: "mobile_tbt_ms", type: "INT64", mode: "NULLABLE" },
    { name: "mobile_speed_index_ms", type: "INT64", mode: "NULLABLE" },
    { name: "mobile_performance_score", type: "INT64", mode: "NULLABLE" },
    { name: "mobile_accessibility_score", type: "INT64", mode: "NULLABLE" },

    // Performance metrics (desktop)
    { name: "desktop_lcp_ms", type: "INT64", mode: "NULLABLE" },
    { name: "desktop_cls", type: "FLOAT64", mode: "NULLABLE" },
    { name: "desktop_inp_ms", type: "INT64", mode: "NULLABLE" },
    { name: "desktop_fcp_ms", type: "INT64", mode: "NULLABLE" },
    { name: "desktop_tbt_ms", type: "INT64", mode: "NULLABLE" },
    { name: "desktop_speed_index_ms", type: "INT64", mode: "NULLABLE" },
    { name: "desktop_performance_score", type: "INT64", mode: "NULLABLE" },
    { name: "desktop_accessibility_score", type: "INT64", mode: "NULLABLE" },

    // Tech signals
    { name: "cms", type: "STRING", mode: "NULLABLE" },
    { name: "cdn", type: "STRING", mode: "NULLABLE" },
    { name: "frameworks", type: "STRING", mode: "REPEATED" },
    { name: "has_ga4", type: "BOOL", mode: "NULLABLE" },
    { name: "has_gtm", type: "BOOL", mode: "NULLABLE" },
    { name: "has_meta_pixel", type: "BOOL", mode: "NULLABLE" },
    { name: "has_google_ads_tag", type: "BOOL", mode: "NULLABLE" },
    { name: "booking_engine_provider", type: "STRING", mode: "NULLABLE" },
    { name: "booking_engine_embedded", type: "BOOL", mode: "NULLABLE" },
    { name: "booking_engine_separate_domain", type: "BOOL", mode: "NULLABLE" },
    { name: "chat_widget", type: "STRING", mode: "NULLABLE" },

    // SEO signals
    { name: "robots_txt_present", type: "BOOL", mode: "NULLABLE" },
    { name: "sitemap_present", type: "BOOL", mode: "NULLABLE" },
    { name: "has_noindex_on_money_pages", type: "BOOL", mode: "NULLABLE" },
    { name: "missing_titles_count", type: "INT64", mode: "NULLABLE" },
    { name: "duplicate_titles_count", type: "INT64", mode: "NULLABLE" },
    { name: "missing_descriptions_count", type: "INT64", mode: "NULLABLE" },
    { name: "has_local_business_schema", type: "BOOL", mode: "NULLABLE" },
    { name: "has_lodging_business_schema", type: "BOOL", mode: "NULLABLE" },
    { name: "has_faq_schema", type: "BOOL", mode: "NULLABLE" },
    { name: "has_review_schema", type: "BOOL", mode: "NULLABLE" },

    // Trust signals
    { name: "has_company_name", type: "BOOL", mode: "NULLABLE" },
    { name: "has_phone", type: "BOOL", mode: "NULLABLE" },
    { name: "has_address", type: "BOOL", mode: "NULLABLE" },
    { name: "onsite_reviews_present", type: "BOOL", mode: "NULLABLE" },
    { name: "onsite_reviews_count", type: "INT64", mode: "NULLABLE" },
    { name: "google_reviews_present", type: "BOOL", mode: "NULLABLE" },
    { name: "google_reviews_rating", type: "FLOAT64", mode: "NULLABLE" },
    { name: "google_reviews_count", type: "INT64", mode: "NULLABLE" },

    // Security signals
    { name: "has_https", type: "BOOL", mode: "NULLABLE" },
    { name: "has_mixed_content", type: "BOOL", mode: "NULLABLE" },
    { name: "ssl_labs_grade", type: "STRING", mode: "NULLABLE" },
    { name: "has_hsts", type: "BOOL", mode: "NULLABLE" },
    { name: "has_csp", type: "BOOL", mode: "NULLABLE" },

    // Content signals
    { name: "image_count", type: "INT64", mode: "NULLABLE" },
    { name: "hero_image_width", type: "INT64", mode: "NULLABLE" },
    { name: "has_video", type: "BOOL", mode: "NULLABLE" },
    { name: "description_word_count", type: "INT64", mode: "NULLABLE" },
    { name: "has_direct_booking_benefits", type: "BOOL", mode: "NULLABLE" },
    { name: "has_local_area_content", type: "BOOL", mode: "NULLABLE" },

    // Booking path summary
    { name: "booking_click_depth", type: "INT64", mode: "NULLABLE" },
    { name: "booking_cross_domain", type: "BOOL", mode: "NULLABLE" },
    { name: "booking_cross_domain_host", type: "STRING", mode: "NULLABLE" },

    // Conversion signals
    { name: "has_persistent_booking_cta_mobile", type: "BOOL", mode: "NULLABLE" },
    { name: "shows_fees_before_checkout", type: "BOOL", mode: "NULLABLE" },
    { name: "shows_cancellation_before_checkout", type: "BOOL", mode: "NULLABLE" },
    { name: "requires_account_creation", type: "BOOL", mode: "NULLABLE" },
    { name: "supports_instant_booking", type: "BOOL", mode: "NULLABLE" },
    { name: "has_inquiry_fallback", type: "BOOL", mode: "NULLABLE" },

    // Artifact counts
    { name: "screenshot_count", type: "INT64", mode: "NULLABLE" },
    { name: "session_replay_count", type: "INT64", mode: "NULLABLE" },
    { name: "error_count", type: "INT64", mode: "NULLABLE" },

    // Top issues summary (JSON for flexibility)
    { name: "top_issue_ids", type: "STRING", mode: "REPEATED" },
    { name: "fast_win_ids", type: "STRING", mode: "REPEATED" },
    { name: "top_contributors", type: "STRING", mode: "REPEATED" },

    // Metadata
    { name: "scoring_version", type: "STRING", mode: "NULLABLE" },
    { name: "inserted_at", type: "TIMESTAMP", mode: "REQUIRED" },
  ],
};

// Findings table - one row per finding
export const findingsSchema: TableSchema = {
  fields: [
    { name: "audit_id", type: "STRING", mode: "REQUIRED" },
    { name: "finding_id", type: "STRING", mode: "REQUIRED" },
    { name: "title", type: "STRING", mode: "REQUIRED" },
    { name: "category", type: "STRING", mode: "REQUIRED" },
    { name: "severity", type: "STRING", mode: "REQUIRED" },
    { name: "impact", type: "FLOAT64", mode: "REQUIRED" },
    { name: "confidence", type: "FLOAT64", mode: "REQUIRED" },
    { name: "penalty", type: "INT64", mode: "REQUIRED" },
    { name: "fix", type: "STRING", mode: "NULLABLE" },
    { name: "effort", type: "STRING", mode: "NULLABLE" },
    { name: "evidence", type: "STRING", mode: "REPEATED" },
    { name: "tags", type: "STRING", mode: "REPEATED" },
    { name: "is_top_issue", type: "BOOL", mode: "REQUIRED" },
    { name: "is_fast_win", type: "BOOL", mode: "REQUIRED" },
    { name: "ranking", type: "INT64", mode: "NULLABLE" },
    { name: "inserted_at", type: "TIMESTAMP", mode: "REQUIRED" },
  ],
};

// Crawled pages table - one row per page crawled
export const crawlPagesSchema: TableSchema = {
  fields: [
    { name: "audit_id", type: "STRING", mode: "REQUIRED" },
    { name: "url", type: "STRING", mode: "REQUIRED" },
    { name: "kind", type: "STRING", mode: "REQUIRED" },
    { name: "strategy", type: "STRING", mode: "REQUIRED" },
    { name: "fetched_at", type: "TIMESTAMP", mode: "NULLABLE" },
    { name: "screenshot_url", type: "STRING", mode: "NULLABLE" },
    { name: "above_fold_text", type: "STRING", mode: "NULLABLE" },
    { name: "dom_hash", type: "STRING", mode: "NULLABLE" },

    // CTAs summary
    { name: "cta_count", type: "INT64", mode: "NULLABLE" },
    { name: "primary_cta_count", type: "INT64", mode: "NULLABLE" },
    { name: "above_fold_cta_count", type: "INT64", mode: "NULLABLE" },
    { name: "cta_labels", type: "STRING", mode: "REPEATED" },

    // Forms summary
    { name: "form_count", type: "INT64", mode: "NULLABLE" },
    { name: "booking_form_count", type: "INT64", mode: "NULLABLE" },
    { name: "inquiry_form_count", type: "INT64", mode: "NULLABLE" },

    // Contact signals
    { name: "has_phone", type: "BOOL", mode: "NULLABLE" },
    { name: "has_email", type: "BOOL", mode: "NULLABLE" },
    { name: "has_address", type: "BOOL", mode: "NULLABLE" },
    { name: "has_live_chat", type: "BOOL", mode: "NULLABLE" },

    // Policy signals
    { name: "has_cancellation_policy", type: "BOOL", mode: "NULLABLE" },
    { name: "has_house_rules", type: "BOOL", mode: "NULLABLE" },
    { name: "has_privacy_policy", type: "BOOL", mode: "NULLABLE" },
    { name: "has_terms", type: "BOOL", mode: "NULLABLE" },

    // Trust elements
    { name: "has_reviews_section", type: "BOOL", mode: "NULLABLE" },
    { name: "has_third_party_review_badges", type: "BOOL", mode: "NULLABLE" },
    { name: "has_secure_payment_badges", type: "BOOL", mode: "NULLABLE" },
    { name: "has_social_proof_mentions", type: "BOOL", mode: "NULLABLE" },

    // Resources
    { name: "total_requests", type: "INT64", mode: "NULLABLE" },
    { name: "total_bytes", type: "INT64", mode: "NULLABLE" },
    { name: "third_party_requests", type: "INT64", mode: "NULLABLE" },
    { name: "third_party_bytes", type: "INT64", mode: "NULLABLE" },
    { name: "has_cookie_banner_blocking_ui", type: "BOOL", mode: "NULLABLE" },

    { name: "inserted_at", type: "TIMESTAMP", mode: "REQUIRED" },
  ],
};

// Booking steps table - one row per booking path step
export const bookingStepsSchema: TableSchema = {
  fields: [
    { name: "audit_id", type: "STRING", mode: "REQUIRED" },
    { name: "step_index", type: "INT64", mode: "REQUIRED" },
    { name: "url", type: "STRING", mode: "REQUIRED" },
    { name: "kind", type: "STRING", mode: "REQUIRED" },
    { name: "success", type: "BOOL", mode: "REQUIRED" },
    { name: "friction_notes", type: "STRING", mode: "REPEATED" },
    { name: "inserted_at", type: "TIMESTAMP", mode: "REQUIRED" },
  ],
};

// Session replays table - one row per replay
export const sessionReplaysSchema: TableSchema = {
  fields: [
    { name: "audit_id", type: "STRING", mode: "REQUIRED" },
    { name: "strategy", type: "STRING", mode: "REQUIRED" },
    { name: "replay_url", type: "STRING", mode: "REQUIRED" },
    { name: "video_url", type: "STRING", mode: "NULLABLE" },
    { name: "duration_ms", type: "INT64", mode: "REQUIRED" },
    { name: "started_at", type: "TIMESTAMP", mode: "NULLABLE" },
    { name: "viewport_width", type: "INT64", mode: "NULLABLE" },
    { name: "viewport_height", type: "INT64", mode: "NULLABLE" },
    { name: "reached_booking", type: "BOOL", mode: "REQUIRED" },
    { name: "blocked_reason", type: "STRING", mode: "NULLABLE" },
    { name: "marker_count", type: "INT64", mode: "NULLABLE" },
    { name: "inserted_at", type: "TIMESTAMP", mode: "REQUIRED" },
  ],
};

// Module errors table - one row per error
export const moduleErrorsSchema: TableSchema = {
  fields: [
    { name: "audit_id", type: "STRING", mode: "REQUIRED" },
    { name: "module", type: "STRING", mode: "REQUIRED" },
    { name: "severity", type: "STRING", mode: "REQUIRED" },
    { name: "message", type: "STRING", mode: "REQUIRED" },
    { name: "retriable", type: "BOOL", mode: "REQUIRED" },
    { name: "inserted_at", type: "TIMESTAMP", mode: "REQUIRED" },
  ],
};

// Lighthouse opportunities table - one row per opportunity
export const lighthouseOpportunitiesSchema: TableSchema = {
  fields: [
    { name: "audit_id", type: "STRING", mode: "REQUIRED" },
    { name: "strategy", type: "STRING", mode: "REQUIRED" },
    { name: "opportunity_id", type: "STRING", mode: "REQUIRED" },
    { name: "title", type: "STRING", mode: "REQUIRED" },
    { name: "description", type: "STRING", mode: "NULLABLE" },
    { name: "estimated_savings_ms", type: "INT64", mode: "NULLABLE" },
    { name: "estimated_savings_bytes", type: "INT64", mode: "NULLABLE" },
    { name: "inserted_at", type: "TIMESTAMP", mode: "REQUIRED" },
  ],
};

// Table configurations with partitioning and clustering
export const tableConfigs: Record<string, Partial<TableMetadata>> = {
  audits: {
    schema: auditsSchema,
    timePartitioning: {
      type: "DAY",
      field: "generated_at",
    },
    clustering: {
      fields: ["domain", "status"],
    },
  },
  findings: {
    schema: findingsSchema,
    timePartitioning: {
      type: "DAY",
      field: "inserted_at",
    },
    clustering: {
      fields: ["audit_id", "category", "severity"],
    },
  },
  crawl_pages: {
    schema: crawlPagesSchema,
    timePartitioning: {
      type: "DAY",
      field: "inserted_at",
    },
    clustering: {
      fields: ["audit_id", "kind"],
    },
  },
  booking_steps: {
    schema: bookingStepsSchema,
    timePartitioning: {
      type: "DAY",
      field: "inserted_at",
    },
    clustering: {
      fields: ["audit_id"],
    },
  },
  session_replays: {
    schema: sessionReplaysSchema,
    timePartitioning: {
      type: "DAY",
      field: "inserted_at",
    },
    clustering: {
      fields: ["audit_id", "strategy"],
    },
  },
  module_errors: {
    schema: moduleErrorsSchema,
    timePartitioning: {
      type: "DAY",
      field: "inserted_at",
    },
    clustering: {
      fields: ["audit_id", "module"],
    },
  },
  lighthouse_opportunities: {
    schema: lighthouseOpportunitiesSchema,
    timePartitioning: {
      type: "DAY",
      field: "inserted_at",
    },
    clustering: {
      fields: ["audit_id", "strategy"],
    },
  },
};

export const ALL_TABLE_NAMES = [
  "audits",
  "findings",
  "crawl_pages",
  "booking_steps",
  "session_replays",
  "module_errors",
  "lighthouse_opportunities",
] as const;

export type TableName = (typeof ALL_TABLE_NAMES)[number];
