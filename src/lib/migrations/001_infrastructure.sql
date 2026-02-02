-- Migration: 001_infrastructure.sql
-- Infrastructure foundation: foreign keys and score column for efficient sorting

-- Enable foreign key support
PRAGMA foreign_keys = ON;

-- Add denormalized score column to audits for efficient sorting/filtering
-- SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so we handle this in the runner
ALTER TABLE audits ADD COLUMN score INTEGER;
