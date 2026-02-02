-- Migration: 003_analytics.sql
-- Built-in analytics for report tracking (independent of GA)

CREATE TABLE IF NOT EXISTS report_views (
  id TEXT PRIMARY KEY,
  audit_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  viewed_at TEXT NOT NULL,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  country TEXT,
  time_on_page_ms INTEGER,
  max_scroll_percent INTEGER,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS report_clicks (
  id TEXT PRIMARY KEY,
  audit_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  clicked_at TEXT NOT NULL,
  cta_type TEXT NOT NULL,
  cta_location TEXT
);

CREATE INDEX IF NOT EXISTS idx_views_audit ON report_views(audit_id);
CREATE INDEX IF NOT EXISTS idx_views_visitor ON report_views(visitor_id);
CREATE INDEX IF NOT EXISTS idx_views_audit_visitor ON report_views(audit_id, visitor_id);
CREATE INDEX IF NOT EXISTS idx_views_date ON report_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_clicks_audit ON report_clicks(audit_id);
