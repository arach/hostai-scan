-- Migration: 002_import_batches.sql
-- Bulk import batch tracking for multiple domain audits

CREATE TABLE IF NOT EXISTS import_batches (
  id TEXT PRIMARY KEY,
  name TEXT,
  source TEXT NOT NULL,
  filename TEXT,
  total_domains INTEGER NOT NULL,
  completed_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  created_by TEXT
);

-- Link audits to batches
ALTER TABLE audits ADD COLUMN batch_id TEXT;
ALTER TABLE audits ADD COLUMN batch_position INTEGER;

-- Index for batch queries
CREATE INDEX IF NOT EXISTS idx_audits_batch ON audits(batch_id);
