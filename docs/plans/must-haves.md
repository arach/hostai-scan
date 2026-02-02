# GetHost.AI Must-Have Features Plan

**Version:** 1.3
**Date:** February 2, 2026
**Status:** 100% Complete (8/8 tasks done)

---

## Task Tracker

| # | Task | Status | Commit |
|---|------|--------|--------|
| 1 | Infrastructure: Migration system + admin auth + schema | ✅ Done | `d4f60a5` |
| 2 | Analytics: View tracking + engagement metrics | ✅ Done | `3979cbf` |
| 3 | GA Integration: Script embed + event tracking | ✅ Done | `63a9198` |
| 4 | UTM Builder: Quick win link enhancement | ✅ Done | `7058a9b` |
| 5 | Bulk Import: Batch processing + file upload | ✅ Done | `4c75368` |
| 6 | Table View: Sortable audit list with filters | ✅ Done | - |
| 7 | Email Capture: Lead gen forms + gating | ✅ Done | - |
| 8 | Link Enhancements: Custom slugs, expiration, QR | ✅ Done | `7058a9b` |

**Branch:** `feature/must-haves` (8 features complete, all must-haves implemented)

---

## What Was Built

### Infrastructure (`src/lib/migrations/`, `src/lib/admin-auth.ts`)
- Migration system with `_migrations` tracking table
- 4 migration files (001-005) for all features
- Admin auth with password protection + 7-day token expiry
- API routes: `/api/admin/login`, `/logout`, `/check`
- Auto-run migrations on database init

### GA Integration (`src/lib/ga.ts`, `src/components/report/ga-tracker.tsx`)
- GA4 script loader with typed event functions
- Events: `report_view`, `report_scroll_*`, `cta_click`, `lead_capture`
- Only loads when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set

### Built-in Analytics (`src/lib/analytics.ts`, `src/components/report/analytics-tracker.tsx`)
- View tracking with visitor/session IDs
- Scroll depth + time-on-page engagement
- First-party cookie (30-day expiry)
- API: `/api/analytics/view`, `/engagement`, `/click`, `/report/[auditId]`

### Bulk Import (`src/lib/batch-storage.ts`, `src/components/admin/bulk-import-modal.tsx`)
- Domain parser with validation + deduplication
- Batch storage with progress tracking
- Parallel processing (max 3 concurrent)
- Modal with preview table + real-time progress

### Link Enhancements (`src/lib/link-storage.ts`, `src/components/admin/link-builder.tsx`)
- UTM link builder with presets
- Custom slugs at `/r/[slug]`
- Expiration dates with friendly expired page
- QR code generation + download
- Signed access tokens

---

## Completed

### #6 Table View (Implemented)
- Sortable audit list with columns: domain, score, status, views, batch
- Filters: status, score range, search
- Pagination (25/50/100 per page)
- Bulk actions: delete, export
- View toggle in admin dashboard (list/table)

### #7 Email Capture (Implemented)
- Lead capture form with GDPR consent checkbox
- Scroll-depth trigger at 80%
- Lead storage with upsert (`/api/leads`)
- Admin lead management page (`/admin/leads`)
- Lead status management (new, contacted, qualified, converted)
- Lead export functionality

---

## Review Feedback Applied

Based on senior engineer review, the following changes were made:

### Priority Reordering
- **Analytics moved to #2** - Start collecting data early, it's purely additive
- **GA Integration moved earlier** - Near zero-effort, marketing needs it immediately
- **UTM Builder extracted** - Quick win (2-4 hours), ship in Week 1

### Must-Fix Before Starting
- [x] **Migration system** - Split into separate migrations, add migration runner
- [x] **Admin auth** - Add basic password protection for `/admin` routes
- [x] **Denormalized score** - Add `score` column to audits for efficient sorting
- [x] **Foreign keys** - Enable with `PRAGMA foreign_keys = ON`
- [x] **Updated timestamps** - Add `updated_at` to all new tables

### Schema Fixes
- [x] Remove `UNIQUE` constraint on `leads.email` (use upsert instead)
- [x] Add `consent_recorded_at` to leads for GDPR
- [x] Add `access_count` to `lead_report_access`
- [x] Add composite index `idx_views_audit_visitor`

### Implementation Simplifications
- [x] **Bulk import**: Start with plain text only (skip CSV/Excel for MVP)
- [x] **Exit intent**: Replace with scroll-depth trigger (80%) - more reliable on mobile
- [x] **Password protection**: Use signed URLs (JWT) instead of bcrypt hashing
- [x] **Geo lookup**: Use Vercel's `x-vercel-ip-country` header (skip city for MVP)

---

## Executive Summary

This document outlines the implementation plan for six must-have features to transform GetHost.AI from a single-audit tool into a scalable lead generation platform. These features enable bulk auditing, organized management, sharable reports, and lead capture - the core GTM infrastructure.

**Revised Priority Order:**
1. Infrastructure (migration system, admin auth, schema fixes)
2. Analytics (view tracking, engagement - start collecting data early)
3. GA Integration (quick win - just add script + events)
4. UTM Builder (quick win - pure UI, no backend)
5. Bulk Import (enables scale)
6. Table View (enables management)
7. Email Capture (enables lead gen)
8. Link Enhancements (custom slugs, expiration, QR)

---

## Current State

### Existing Infrastructure

**Database (Turso/SQLite):**
- `audits` table: id, domain, status, created_at, completed_at, result (JSON), error
- `audit_jobs` table: id, domain, status, progress, current_step, result, error, created_at, completed_at

**API Routes:**
- `POST /api/audit/start` - Start single audit
- `GET /api/audit/status/[jobId]` - Poll job status
- `GET /api/audits` - List audits (with domain filter)
- `GET /api/audit/[auditId]` - Get single audit

**UI:**
- `/admin` - Basic admin page with single/bulk textarea input
- `/report/[auditId]` - Public report page with variant support (`?v=a|b|c`)

### What Already Works
- Single domain audit execution
- Basic bulk import via textarea (one-at-a-time execution)
- Report viewing at `/report/[auditId]`
- Job progress polling
- API balance display (SEMrush, DataForSEO)

---

## Feature 1: Bulk Import

### What It Does
Upload multiple domains at once via file upload or enhanced textarea. Process audits in parallel with queue management, rate limiting, and batch tracking.

### Why It Matters
Sales teams need to audit prospect lists efficiently. A CSV of 50 domains should process automatically without manual intervention.

### Key UI/UX Considerations
- **File upload**: Drag-and-drop zone accepting `.csv`, `.txt`, `.xlsx`
- **Paste area**: Smart parsing of domains from any format (one per line, comma-separated, with/without https)
- **Preview**: Show parsed domains before starting with validation status
- **Batch naming**: Optional name for the import batch (e.g., "Q1 2026 Prospects")
- **Progress view**: Dashboard showing batch progress with per-domain status

### Data Model

```sql
-- New table for import batches
CREATE TABLE import_batches (
  id TEXT PRIMARY KEY,
  name TEXT,
  source TEXT NOT NULL,  -- 'file', 'paste', 'api'
  filename TEXT,         -- Original filename if file upload
  total_domains INTEGER NOT NULL,
  completed_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, processing, completed, failed
  created_at TEXT NOT NULL,
  completed_at TEXT,
  created_by TEXT        -- Future: user ID when auth added
);

-- Link audits to batches
ALTER TABLE audits ADD COLUMN batch_id TEXT REFERENCES import_batches(id);
ALTER TABLE audits ADD COLUMN batch_position INTEGER;  -- Order in batch
```

### API Endpoints

```typescript
// POST /api/import/upload
// Accepts multipart form with file
// Returns: { batchId, domains: string[], validCount, invalidCount }

// POST /api/import/start
// Body: { batchId } or { domains: string[], name?: string }
// Returns: { batchId, jobIds: string[] }

// GET /api/import/[batchId]
// Returns batch status with per-domain progress

// GET /api/import/batches
// Returns list of all batches with summary stats
```

### Implementation Approach

1. **Phase 1: Enhanced Parsing**
   - Create `lib/domain-parser.ts` with smart domain extraction
   - Handle various formats: URLs, bare domains, CSV columns
   - Validate and deduplicate

2. **Phase 2: Batch Management**
   - Add `import_batches` table migration
   - Create batch CRUD functions in `lib/batch-storage.ts`
   - Update `audit-storage.ts` to support batch_id

3. **Phase 3: Parallel Processing**
   - Implement concurrent audit execution (max 3-5 parallel)
   - Add rate limiting to respect API quotas
   - Update `audit-queue.ts` with batch awareness

4. **Phase 4: UI Components**
   - Create `components/admin/bulk-import-modal.tsx`
   - Add file drop zone with preview table
   - Show real-time batch progress

---

## Feature 2: Table View

### What It Does
A proper data table in the admin interface with sortable columns, filters, pagination, and bulk actions.

### Why It Matters
Managing 100+ audits requires proper tooling. Quick sorting by score, filtering by status, and bulk operations save time.

### Key UI/UX Considerations

**Columns:**
- Checkbox (bulk select)
- Domain (linked to report)
- Score (with color indicator)
- Status (badge: complete, pending, failed)
- Created date
- Batch name (if applicable)
- View count (from analytics)
- Actions (copy link, re-run, delete)

**Features:**
- Column sorting (click headers)
- Multi-column sort (shift-click)
- Filters: status, score range, date range, batch
- Search: domain substring
- Pagination: 25/50/100 per page
- Bulk actions: delete, re-run, export

### Data Model
No new tables needed. Enhance existing queries with:
- Sorting parameters
- Filter conditions
- Pagination (LIMIT/OFFSET or cursor-based)
- Join with `report_views` for view counts (from Analytics feature)

### API Endpoints

```typescript
// GET /api/audits (enhanced)
// Query params:
//   sort: "score" | "created_at" | "domain" | "views"
//   order: "asc" | "desc"
//   status: "completed" | "pending" | "failed"
//   score_min: number
//   score_max: number
//   batch_id: string
//   search: string (domain contains)
//   page: number
//   limit: number
// Returns: { audits, total, page, totalPages }

// POST /api/audits/bulk-delete
// Body: { auditIds: string[] }

// POST /api/audits/bulk-rerun
// Body: { auditIds: string[] }
// Returns: { jobIds: string[] }

// GET /api/audits/export
// Query: same filters as list
// Returns: CSV download
```

### Implementation Approach

1. **Phase 1: Enhanced List API**
   - Update `/api/audits/route.ts` with full query support
   - Add efficient SQL with proper indexes

2. **Phase 2: Table Component**
   - Install/use lightweight table library (or build custom with Tailwind)
   - Create `components/admin/audit-table.tsx`
   - Implement column sorting, selection state

3. **Phase 3: Filters & Search**
   - Create `components/admin/table-filters.tsx`
   - Debounced search input
   - Filter dropdowns with URL state sync

4. **Phase 4: Bulk Actions**
   - Selection management with "select all" across pages
   - Confirmation modals for destructive actions
   - Progress feedback for bulk operations

---

## Feature 3: Analytics

### What It Does
Track report views, unique visitors, engagement metrics (time on page, scroll depth, CTA clicks). Built-in analytics, not dependent on GA.

### Why It Matters
Know which reports get viewed, which prospects engage, and which CTAs convert. Essential for sales prioritization.

### Key UI/UX Considerations

**Report Page (invisible):**
- Pixel tracking on page load
- Scroll depth milestones (25%, 50%, 75%, 100%)
- CTA click tracking
- Time on page (beacon on unload)

**Admin Dashboard:**
- Per-report stats: views, unique visitors, avg time, scroll depth
- Aggregate stats: total views today/week/month
- Top viewed reports
- CTA click-through rates
- Geographic breakdown (country/city from IP)

### Data Model

```sql
-- Report view events
CREATE TABLE report_views (
  id TEXT PRIMARY KEY,
  audit_id TEXT NOT NULL REFERENCES audits(id),
  visitor_id TEXT NOT NULL,     -- Anonymous ID from cookie
  session_id TEXT NOT NULL,     -- Per-session ID
  viewed_at TEXT NOT NULL,

  -- Context
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,

  -- Geo (from IP lookup)
  country TEXT,
  city TEXT,

  -- Engagement (updated via beacon)
  time_on_page_ms INTEGER,
  max_scroll_percent INTEGER,

  -- Device
  device_type TEXT,  -- mobile, tablet, desktop
  browser TEXT,
  os TEXT
);

-- CTA click events
CREATE TABLE report_clicks (
  id TEXT PRIMARY KEY,
  audit_id TEXT NOT NULL REFERENCES audits(id),
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  clicked_at TEXT NOT NULL,

  cta_type TEXT NOT NULL,  -- 'get_started', 'contact', 'new_audit'
  cta_location TEXT        -- 'sticky_footer', 'hero', 'inline'
);

-- Indexes
CREATE INDEX idx_views_audit ON report_views(audit_id);
CREATE INDEX idx_views_visitor ON report_views(visitor_id);
CREATE INDEX idx_views_date ON report_views(viewed_at);
CREATE INDEX idx_clicks_audit ON report_clicks(audit_id);
```

### API Endpoints

```typescript
// POST /api/analytics/view
// Body: { auditId, visitorId, sessionId, referrer, utmParams, deviceInfo }
// Returns: { viewId }

// POST /api/analytics/engagement
// Body: { viewId, timeOnPageMs, maxScrollPercent }
// Beacon endpoint - fire and forget

// POST /api/analytics/click
// Body: { auditId, visitorId, sessionId, ctaType, ctaLocation }

// GET /api/analytics/report/[auditId]
// Returns: { totalViews, uniqueVisitors, avgTimeOnPage, avgScrollDepth, ctaClicks }

// GET /api/analytics/dashboard
// Query: { period: '24h' | '7d' | '30d' }
// Returns: { totalViews, topReports, clickThroughRate, geoBreakdown }
```

### Implementation Approach

1. **Phase 1: Tracking Infrastructure**
   - Create `lib/analytics.ts` with tracking functions
   - Generate/persist visitor ID in cookie
   - Session ID per page load

2. **Phase 2: Report Page Integration**
   - Add tracking script to report layout
   - Fire view event on mount
   - Track scroll with IntersectionObserver
   - Beacon time on page via `visibilitychange` event

3. **Phase 3: Click Tracking**
   - Wrap CTAs with tracking handler
   - Fire click event before navigation

4. **Phase 4: Admin Analytics UI**
   - Create `components/admin/analytics-dashboard.tsx`
   - Add per-report stats to table view
   - Charts for trends (use existing recharts dependency)

---

## Feature 4: Email Capture

### What It Does
Gate full report access behind email capture, or offer email for "detailed PDF" / "re-audit notifications". Flexible lead capture at various points.

### Why It Matters
The whole point is lead generation. Every report view should be an opportunity to capture contact info.

### Key UI/UX Considerations

**Capture Points:**
1. **Pre-report gate** (aggressive): Email required to view full report
2. **Partial reveal** (medium): Show score + summary, email for details
3. **Value-add offer** (gentle): Full report visible, email for PDF/updates
4. **Exit intent** (recovery): Popup when leaving without email

**Form Fields:**
- Email (required)
- Name (optional but encouraged)
- Company (optional)
- Phone (optional, for high-intent)

**UX Considerations:**
- Remember captured emails (don't re-ask)
- Clear value proposition for email
- GDPR-friendly with consent checkbox
- Instant gratification after submit

### Data Model

```sql
-- Captured leads
CREATE TABLE leads (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  company TEXT,
  phone TEXT,

  -- Capture context
  captured_at TEXT NOT NULL,
  capture_point TEXT NOT NULL,  -- 'pre_gate', 'partial_reveal', 'pdf_offer', 'exit_intent'
  first_audit_id TEXT REFERENCES audits(id),

  -- Attribution
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer TEXT,

  -- Engagement
  reports_viewed INTEGER DEFAULT 0,
  last_active_at TEXT,

  -- Status
  status TEXT DEFAULT 'new',  -- new, contacted, qualified, converted
  notes TEXT
);

-- Track which reports a lead has viewed
CREATE TABLE lead_report_access (
  lead_id TEXT REFERENCES leads(id),
  audit_id TEXT REFERENCES audits(id),
  accessed_at TEXT NOT NULL,
  PRIMARY KEY (lead_id, audit_id)
);

CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_captured ON leads(captured_at);
```

### API Endpoints

```typescript
// POST /api/leads/capture
// Body: { email, name?, company?, phone?, capturePoint, auditId, utmParams }
// Returns: { leadId, accessToken }

// GET /api/leads/check
// Query: { email } or cookie-based
// Returns: { captured: boolean, leadId? }

// GET /api/leads
// Admin endpoint - list all leads with filters
// Query: { status, capturePoint, dateRange, search }

// GET /api/leads/[leadId]
// Admin endpoint - lead details with activity

// PATCH /api/leads/[leadId]
// Admin endpoint - update status, notes

// GET /api/leads/export
// Admin endpoint - CSV export
```

### Implementation Approach

1. **Phase 1: Lead Capture Form**
   - Create `components/report/email-gate.tsx`
   - Handle form submission with validation
   - Store lead and set cookie for access

2. **Phase 2: Access Control Logic**
   - Create `lib/lead-access.ts` with access check functions
   - Middleware or server component check for gated reports
   - Configuration for gate type per report or global

3. **Phase 3: Capture Point Integration**
   - Pre-gate: Wrapper component around report
   - Partial reveal: Modified report component with blur/lock
   - Exit intent: Popup component with mouse tracking

4. **Phase 4: Admin Lead Management**
   - Create `app/admin/leads/page.tsx`
   - Lead list with filters and search
   - Lead detail view with activity timeline
   - Export functionality

---

## Feature 5: Link Generation Enhancements

### What It Does
Enhance existing shareable report URLs with UTM tracking, custom slugs, expiration, and password protection.

### Why It Matters
Sales needs trackable, professional links. Marketing needs attribution. Security needs expiration for sensitive audits.

### Current State
- Reports accessible at `/report/[auditId]`
- Audit ID is `{domain-slug}-{timestamp}`
- No tracking, no expiration, no protection

### Key UI/UX Considerations

**Link Options:**
- Custom slug (e.g., `/report/acme-vacation-rentals` instead of `/report/acme-com-1706800000`)
- UTM parameters pre-built into shareable link
- Expiration date (optional)
- Password protection (optional)
- QR code generation

**Copy Experience:**
- One-click copy with UTM params
- Preview of full URL
- Success toast with "Link copied!"

### Data Model

```sql
-- Extend audits table (or create link_settings)
CREATE TABLE report_links (
  audit_id TEXT PRIMARY KEY REFERENCES audits(id),
  custom_slug TEXT UNIQUE,

  -- Access control
  expires_at TEXT,
  password_hash TEXT,

  -- Defaults for sharing
  default_utm_source TEXT,
  default_utm_medium TEXT,
  default_utm_campaign TEXT,

  -- Stats
  link_copies INTEGER DEFAULT 0,
  qr_downloads INTEGER DEFAULT 0
);

CREATE INDEX idx_links_slug ON report_links(custom_slug);
```

### API Endpoints

```typescript
// PATCH /api/audit/[auditId]/link
// Body: { customSlug?, expiresAt?, password?, defaultUtm? }
// Returns: { url, qrCodeDataUrl }

// GET /api/report/[slug]
// Resolve custom slug to audit ID

// POST /api/report/[auditId]/verify-password
// Body: { password }
// Returns: { valid: boolean, accessToken? }
```

### Implementation Approach

1. **Phase 1: Custom Slugs**
   - Add slug resolution in report page
   - Update admin UI with slug editing
   - Validate uniqueness

2. **Phase 2: UTM Builder**
   - Create `components/admin/link-builder.tsx`
   - Pre-fill UTM params based on context
   - One-click copy with full URL

3. **Phase 3: Access Control**
   - Password check middleware/component
   - Expiration check in report page
   - Graceful "expired" or "access denied" pages

4. **Phase 4: QR Codes**
   - Use `qrcode` library to generate QR
   - Download as PNG
   - Embed in PDF reports (future)

---

## Feature 6: GA Integration

### What It Does
Embed Google Analytics with custom events and conversion goals. Track report views, CTA clicks, and lead captures in GA for marketing attribution.

### Why It Matters
Marketing uses GA for attribution. Built-in analytics are great but GA integration lets them see report engagement alongside other campaigns.

### Key UI/UX Considerations

**Events to Track:**
- `report_view` - When report loads
- `report_scroll_50` - 50% scroll milestone
- `report_scroll_100` - 100% scroll
- `cta_click` - Any CTA clicked (with label)
- `lead_capture` - Email submitted
- `pdf_download` - PDF report downloaded (future)

**Conversion Goals:**
- Lead captured (primary)
- CTA clicked to HostAI (secondary)
- Report viewed to completion (engagement)

### Data Model
No database changes needed. Configuration via environment variables:

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
GA_CONVERSION_LEAD_CAPTURE=AW-XXXXXXXXX/XXXXX
GA_CONVERSION_CTA_CLICK=AW-XXXXXXXXX/XXXXX
```

### Implementation Approach

1. **Phase 1: GA Script Setup**
   - Add GA4 script to report layout
   - Create `lib/ga.ts` with typed event functions

2. **Phase 2: Event Tracking**
   - Fire `report_view` on page load
   - Track scroll milestones
   - Track CTA clicks with event labels

3. **Phase 3: Conversion Tracking**
   - Fire conversion events for lead capture
   - Add Google Ads conversion tags if needed

4. **Phase 4: Enhanced Ecommerce (Optional)**
   - Treat audit as "product view"
   - Lead capture as "purchase"
   - Revenue value based on prospect quality

---

## Database Migration Plan

**Updated:** Split into separate, idempotent migrations per review feedback.

### Migration 001: Infrastructure
```sql
-- Migration: 001_infrastructure.sql
PRAGMA foreign_keys = ON;

-- Add denormalized score for efficient sorting
ALTER TABLE audits ADD COLUMN score INTEGER;

-- Add updated_at pattern for all tables
-- (Applied to new tables in subsequent migrations)
```

### Migration 002: Import Batches
```sql
-- Migration: 002_import_batches.sql
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

ALTER TABLE audits ADD COLUMN batch_id TEXT;
ALTER TABLE audits ADD COLUMN batch_position INTEGER;
CREATE INDEX IF NOT EXISTS idx_audits_batch ON audits(batch_id);
```

### Migration 003: Analytics
```sql
-- Migration: 003_analytics.sql
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
```

### Migration 004: Leads
```sql
-- Migration: 004_leads.sql
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,  -- No UNIQUE, use upsert logic
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
  consent_recorded_at TEXT,  -- GDPR compliance
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
```

### Migration 005: Report Links
```sql
-- Migration: 005_report_links.sql
CREATE TABLE IF NOT EXISTS report_links (
  audit_id TEXT PRIMARY KEY,
  custom_slug TEXT UNIQUE,
  expires_at TEXT,
  access_token TEXT,  -- Signed JWT instead of password_hash
  default_utm_source TEXT,
  default_utm_medium TEXT,
  default_utm_campaign TEXT,
  link_copies INTEGER DEFAULT 0,
  qr_downloads INTEGER DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_links_slug ON report_links(custom_slug);
```

---

## Legacy Migration Reference

<details>
<summary>Original single migration (deprecated)</summary>

```sql
-- Migration: 001_must_have_features.sql

-- 1. Import batches
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
  completed_at TEXT,
  created_by TEXT
);

-- 2. Extend audits
ALTER TABLE audits ADD COLUMN batch_id TEXT REFERENCES import_batches(id);
ALTER TABLE audits ADD COLUMN batch_position INTEGER;

-- 3. Analytics - views
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
  city TEXT,
  time_on_page_ms INTEGER,
  max_scroll_percent INTEGER,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  FOREIGN KEY (audit_id) REFERENCES audits(id)
);

-- 4. Analytics - clicks
CREATE TABLE IF NOT EXISTS report_clicks (
  id TEXT PRIMARY KEY,
  audit_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  clicked_at TEXT NOT NULL,
  cta_type TEXT NOT NULL,
  cta_location TEXT,
  FOREIGN KEY (audit_id) REFERENCES audits(id)
);

-- 5. Leads
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
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
  FOREIGN KEY (first_audit_id) REFERENCES audits(id)
);

-- 6. Lead access tracking
CREATE TABLE IF NOT EXISTS lead_report_access (
  lead_id TEXT NOT NULL,
  audit_id TEXT NOT NULL,
  accessed_at TEXT NOT NULL,
  PRIMARY KEY (lead_id, audit_id),
  FOREIGN KEY (lead_id) REFERENCES leads(id),
  FOREIGN KEY (audit_id) REFERENCES audits(id)
);

-- 7. Link settings
CREATE TABLE IF NOT EXISTS report_links (
  audit_id TEXT PRIMARY KEY,
  custom_slug TEXT UNIQUE,
  expires_at TEXT,
  password_hash TEXT,
  default_utm_source TEXT,
  default_utm_medium TEXT,
  default_utm_campaign TEXT,
  link_copies INTEGER DEFAULT 0,
  qr_downloads INTEGER DEFAULT 0,
  FOREIGN KEY (audit_id) REFERENCES audits(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audits_batch ON audits(batch_id);
CREATE INDEX IF NOT EXISTS idx_views_audit ON report_views(audit_id);
CREATE INDEX IF NOT EXISTS idx_views_visitor ON report_views(visitor_id);
CREATE INDEX IF NOT EXISTS idx_views_date ON report_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_clicks_audit ON report_clicks(audit_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_captured ON leads(captured_at);
CREATE INDEX IF NOT EXISTS idx_links_slug ON report_links(custom_slug);
```

</details>

---

## Implementation Timeline (Revised)

### Week 1: Infrastructure + Quick Wins
- [ ] Migration system setup
- [ ] Admin auth (basic password)
- [ ] Schema updates (score column, foreign keys)
- [ ] GA integration (script + events)
- [ ] UTM builder component

### Week 2: Analytics
- [ ] Analytics tables migration
- [ ] View tracking on report pages
- [ ] Scroll depth + time on page
- [ ] CTA click tracking
- [ ] Visitor ID cookie

### Week 3-4: Bulk Import + Table View
- [ ] Import batches table
- [ ] Domain parser (plain text MVP)
- [ ] Parallel processing with rate limiting
- [ ] Audit table component with sorting
- [ ] Filters and pagination

### Week 5-6: Lead Capture
- [ ] Leads table migration
- [ ] Email capture form component
- [ ] Scroll-depth trigger (80%)
- [ ] Lead storage with upsert
- [ ] Admin lead list

### Week 7-8: Link Enhancements + Polish
- [ ] Custom slugs
- [ ] Signed URL expiration
- [ ] QR code generation
- [ ] Analytics dashboard
- [ ] Export functionality

---

## File Structure (New Files)

```
src/
├── app/
│   ├── api/
│   │   ├── import/
│   │   │   ├── upload/route.ts
│   │   │   ├── start/route.ts
│   │   │   └── [batchId]/route.ts
│   │   ├── analytics/
│   │   │   ├── view/route.ts
│   │   │   ├── engagement/route.ts
│   │   │   ├── click/route.ts
│   │   │   └── dashboard/route.ts
│   │   └── leads/
│   │       ├── capture/route.ts
│   │       ├── check/route.ts
│   │       └── [leadId]/route.ts
│   └── admin/
│       ├── leads/page.tsx
│       └── analytics/page.tsx
├── components/
│   ├── admin/
│   │   ├── audit-table.tsx
│   │   ├── table-filters.tsx
│   │   ├── bulk-import-modal.tsx
│   │   ├── link-builder.tsx
│   │   └── analytics-dashboard.tsx
│   └── report/
│       ├── email-gate.tsx
│       ├── partial-reveal.tsx
│       └── exit-intent-popup.tsx
└── lib/
    ├── domain-parser.ts
    ├── batch-storage.ts
    ├── analytics.ts
    ├── lead-storage.ts
    ├── ga.ts
    └── migrations/
        └── 001_must_have_features.sql
```

---

## Success Metrics

| Feature | Metric | Target |
|---------|--------|--------|
| Bulk Import | Domains processed per batch | 50+ |
| Table View | Time to find specific audit | < 5 seconds |
| Analytics | Report view tracking accuracy | 99%+ |
| Email Capture | Lead capture rate | 15%+ of views |
| Link Generation | Links copied per audit | 2+ |
| GA Integration | Event tracking accuracy | 99%+ |
