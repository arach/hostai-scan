-- Migration: 004_leads.sql
-- Lead capture and management for email gating

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  company TEXT,
  phone TEXT,
  captured_at TEXT NOT NULL,
  capture_point TEXT NOT NULL,
  first_audit_id TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer TEXT,
  reports_viewed INTEGER DEFAULT 0,
  last_active_at TEXT,
  status TEXT DEFAULT 'new',
  notes TEXT,
  consent_recorded_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS lead_report_access (
  lead_id TEXT NOT NULL,
  audit_id TEXT NOT NULL,
  first_accessed_at TEXT NOT NULL,
  last_accessed_at TEXT NOT NULL,
  access_count INTEGER DEFAULT 1,
  PRIMARY KEY (lead_id, audit_id)
);

CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_captured ON leads(captured_at);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
