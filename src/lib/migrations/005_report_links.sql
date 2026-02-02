-- Migration: 005_report_links.sql
-- Report link enhancements: custom slugs, expiration, QR codes, UTM defaults

CREATE TABLE IF NOT EXISTS report_links (
  audit_id TEXT PRIMARY KEY,
  custom_slug TEXT UNIQUE,
  expires_at TEXT,
  access_token TEXT,
  default_utm_source TEXT,
  default_utm_medium TEXT,
  default_utm_campaign TEXT,
  link_copies INTEGER DEFAULT 0,
  qr_downloads INTEGER DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_links_slug ON report_links(custom_slug);
