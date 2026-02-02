/**
 * BigQuery schema definitions for AuditResult data
 *
 * Tables:
 * - audits: Main audit table with scores, categories, and metadata
 * - recommendations: Individual recommendations per audit
 */

import type { TableSchema, TableMetadata } from "@google-cloud/bigquery";

// Main audits table - one row per audit
export const auditsSchema: TableSchema = {
  fields: [
    { name: "audit_id", type: "STRING", mode: "REQUIRED" },
    { name: "domain", type: "STRING", mode: "REQUIRED" },
    { name: "timestamp", type: "TIMESTAMP", mode: "REQUIRED" },

    // Scores
    { name: "overall_score", type: "INT64", mode: "REQUIRED" },
    { name: "projected_score", type: "INT64", mode: "NULLABLE" },
    { name: "monthly_revenue_loss", type: "FLOAT64", mode: "NULLABLE" },
    { name: "summary", type: "STRING", mode: "NULLABLE" },

    // Category scores (flattened)
    { name: "performance_score", type: "INT64", mode: "NULLABLE" },
    { name: "seo_score", type: "INT64", mode: "NULLABLE" },
    { name: "conversion_score", type: "INT64", mode: "NULLABLE" },
    { name: "trust_score", type: "INT64", mode: "NULLABLE" },
    { name: "content_score", type: "INT64", mode: "NULLABLE" },

    // Core Web Vitals
    { name: "lcp_ms", type: "INT64", mode: "NULLABLE" },
    { name: "lcp_category", type: "STRING", mode: "NULLABLE" },
    { name: "fid_ms", type: "INT64", mode: "NULLABLE" },
    { name: "fid_category", type: "STRING", mode: "NULLABLE" },
    { name: "cls_score", type: "FLOAT64", mode: "NULLABLE" },
    { name: "cls_category", type: "STRING", mode: "NULLABLE" },
    { name: "fcp_ms", type: "INT64", mode: "NULLABLE" },
    { name: "fcp_category", type: "STRING", mode: "NULLABLE" },

    // Lighthouse scores
    { name: "lighthouse_performance", type: "INT64", mode: "NULLABLE" },
    { name: "lighthouse_accessibility", type: "INT64", mode: "NULLABLE" },
    { name: "lighthouse_best_practices", type: "INT64", mode: "NULLABLE" },
    { name: "lighthouse_seo", type: "INT64", mode: "NULLABLE" },

    // SEO Metrics
    { name: "organic_traffic", type: "INT64", mode: "NULLABLE" },
    { name: "organic_keywords", type: "INT64", mode: "NULLABLE" },
    { name: "backlinks", type: "INT64", mode: "NULLABLE" },
    { name: "domain_rank", type: "INT64", mode: "NULLABLE" },
    { name: "authority_score", type: "INT64", mode: "NULLABLE" },

    // Booking Flow
    { name: "has_booking_cta", type: "BOOL", mode: "NULLABLE" },
    { name: "cta_text", type: "STRING", mode: "NULLABLE" },
    { name: "cta_location", type: "STRING", mode: "NULLABLE" },
    { name: "booking_engine_name", type: "STRING", mode: "NULLABLE" },
    { name: "booking_engine_type", type: "STRING", mode: "NULLABLE" },
    { name: "has_date_picker", type: "BOOL", mode: "NULLABLE" },
    { name: "has_instant_book", type: "BOOL", mode: "NULLABLE" },
    { name: "clicks_to_book", type: "INT64", mode: "NULLABLE" },
    { name: "friction_score", type: "INT64", mode: "NULLABLE" },

    // Trust Signals
    { name: "trust_score_overall", type: "INT64", mode: "NULLABLE" },
    { name: "has_reviews", type: "BOOL", mode: "NULLABLE" },
    { name: "review_count", type: "INT64", mode: "NULLABLE" },
    { name: "average_rating", type: "FLOAT64", mode: "NULLABLE" },
    { name: "has_phone", type: "BOOL", mode: "NULLABLE" },
    { name: "has_email", type: "BOOL", mode: "NULLABLE" },
    { name: "has_address", type: "BOOL", mode: "NULLABLE" },
    { name: "has_privacy_policy", type: "BOOL", mode: "NULLABLE" },

    // Metadata
    { name: "fetch_time_ms", type: "INT64", mode: "NULLABLE" },
    { name: "url", type: "STRING", mode: "NULLABLE" },
    { name: "inserted_at", type: "TIMESTAMP", mode: "REQUIRED" },
  ],
};

// Recommendations table - one row per recommendation
export const recommendationsSchema: TableSchema = {
  fields: [
    { name: "audit_id", type: "STRING", mode: "REQUIRED" },
    { name: "title", type: "STRING", mode: "REQUIRED" },
    { name: "description", type: "STRING", mode: "NULLABLE" },
    { name: "status", type: "STRING", mode: "REQUIRED" },
    { name: "impact", type: "STRING", mode: "REQUIRED" },
    { name: "category", type: "STRING", mode: "REQUIRED" },
    { name: "inserted_at", type: "TIMESTAMP", mode: "REQUIRED" },
  ],
};

// Categories table - one row per category per audit
export const categoriesSchema: TableSchema = {
  fields: [
    { name: "audit_id", type: "STRING", mode: "REQUIRED" },
    { name: "name", type: "STRING", mode: "REQUIRED" },
    { name: "score", type: "INT64", mode: "REQUIRED" },
    { name: "weight", type: "FLOAT64", mode: "REQUIRED" },
    { name: "description", type: "STRING", mode: "NULLABLE" },
    { name: "source", type: "STRING", mode: "NULLABLE" },
    { name: "inserted_at", type: "TIMESTAMP", mode: "REQUIRED" },
  ],
};

// Table configurations with partitioning and clustering
export const tableConfigs: Record<string, Partial<TableMetadata>> = {
  audits: {
    schema: auditsSchema,
    timePartitioning: {
      type: "DAY",
      field: "timestamp",
    },
    clustering: {
      fields: ["domain"],
    },
  },
  recommendations: {
    schema: recommendationsSchema,
    timePartitioning: {
      type: "DAY",
      field: "inserted_at",
    },
    clustering: {
      fields: ["audit_id", "category", "impact"],
    },
  },
  categories: {
    schema: categoriesSchema,
    timePartitioning: {
      type: "DAY",
      field: "inserted_at",
    },
    clustering: {
      fields: ["audit_id", "name"],
    },
  },
};

export const ALL_TABLE_NAMES = ["audits", "recommendations", "categories"] as const;

export type TableName = (typeof ALL_TABLE_NAMES)[number];
