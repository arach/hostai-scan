/**
 * Lead Storage for GetHost.AI
 *
 * Handles lead capture, upsert, and management.
 * Supports GDPR-compliant email capture with consent tracking.
 */

import { getDb } from "./db";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface LeadData {
  email: string;
  name?: string;
  company?: string;
  phone?: string;
  capturePoint: string;
  auditId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
  consentGiven: boolean;
}

export interface Lead {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  phone: string | null;
  capturedAt: string;
  capturePoint: string;
  firstAuditId: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  referrer: string | null;
  reportsViewed: number;
  lastActiveAt: string | null;
  status: string;
  notes: string | null;
  consentRecordedAt: string | null;
}

export interface LeadListParams {
  status?: string;
  capturePoint?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: "captured_at" | "email" | "reports_viewed" | "last_active_at";
  sortOrder?: "asc" | "desc";
}

export interface LeadListResult {
  leads: Lead[];
  total: number;
}

// -----------------------------------------------------------------------------
// ID Generation
// -----------------------------------------------------------------------------

function generateLeadId(): string {
  return `lead_${Date.now()}_${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
}

// -----------------------------------------------------------------------------
// Lead Functions
// -----------------------------------------------------------------------------

/**
 * Capture a new lead or update existing (upsert by email)
 * Returns the lead ID and whether it was new or existing
 */
export async function captureLead(
  data: LeadData
): Promise<{ leadId: string; isNew: boolean }> {
  const db = await getDb();
  const now = new Date().toISOString();

  // Check if lead exists by email
  const existing = await db.execute({
    sql: `SELECT id, reports_viewed FROM leads WHERE email = ? LIMIT 1`,
    args: [data.email.toLowerCase().trim()],
  });

  if (existing.rows.length > 0) {
    // Update existing lead
    const leadId = existing.rows[0].id as string;
    const currentViewed = (existing.rows[0].reports_viewed as number) || 0;

    await db.execute({
      sql: `
        UPDATE leads SET
          name = COALESCE(?, name),
          company = COALESCE(?, company),
          phone = COALESCE(?, phone),
          reports_viewed = ?,
          last_active_at = ?,
          updated_at = ?
        WHERE id = ?
      `,
      args: [
        data.name || null,
        data.company || null,
        data.phone || null,
        currentViewed + 1,
        now,
        now,
        leadId,
      ],
    });

    // Record report access if auditId provided
    if (data.auditId) {
      await recordReportAccess(leadId, data.auditId);
    }

    return { leadId, isNew: false };
  }

  // Create new lead
  const leadId = generateLeadId();

  await db.execute({
    sql: `
      INSERT INTO leads (
        id, email, name, company, phone,
        captured_at, capture_point, first_audit_id,
        utm_source, utm_medium, utm_campaign, referrer,
        reports_viewed, last_active_at, status,
        consent_recorded_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      leadId,
      data.email.toLowerCase().trim(),
      data.name || null,
      data.company || null,
      data.phone || null,
      now,
      data.capturePoint,
      data.auditId || null,
      data.utmSource || null,
      data.utmMedium || null,
      data.utmCampaign || null,
      data.referrer || null,
      1,
      now,
      "new",
      data.consentGiven ? now : null,
      now,
    ],
  });

  // Record report access if auditId provided
  if (data.auditId) {
    await recordReportAccess(leadId, data.auditId);
  }

  return { leadId, isNew: true };
}

/**
 * Record that a lead accessed a report
 */
async function recordReportAccess(
  leadId: string,
  auditId: string
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();

  // Upsert: insert or update access count
  await db.execute({
    sql: `
      INSERT INTO lead_report_access (lead_id, audit_id, first_accessed_at, last_accessed_at, access_count)
      VALUES (?, ?, ?, ?, 1)
      ON CONFLICT (lead_id, audit_id) DO UPDATE SET
        last_accessed_at = excluded.last_accessed_at,
        access_count = access_count + 1
    `,
    args: [leadId, auditId, now, now],
  });
}

/**
 * Check if an email is already captured
 */
export async function checkLeadByEmail(
  email: string
): Promise<{ captured: boolean; leadId?: string }> {
  const db = await getDb();

  const result = await db.execute({
    sql: `SELECT id FROM leads WHERE email = ? LIMIT 1`,
    args: [email.toLowerCase().trim()],
  });

  if (result.rows.length > 0) {
    return { captured: true, leadId: result.rows[0].id as string };
  }

  return { captured: false };
}

/**
 * Get a single lead by ID
 */
export async function getLead(leadId: string): Promise<Lead | null> {
  const db = await getDb();

  const result = await db.execute({
    sql: `SELECT * FROM leads WHERE id = ?`,
    args: [leadId],
  });

  if (result.rows.length === 0) {
    return null;
  }

  return mapRowToLead(result.rows[0]);
}

/**
 * List leads with filtering, pagination, and sorting
 */
export async function listLeads(params: LeadListParams): Promise<LeadListResult> {
  const db = await getDb();

  const {
    status,
    capturePoint,
    search,
    limit = 50,
    offset = 0,
    sortBy = "captured_at",
    sortOrder = "desc",
  } = params;

  // Build WHERE clause
  const conditions: string[] = [];
  const args: (string | number)[] = [];

  if (status) {
    conditions.push("status = ?");
    args.push(status);
  }

  if (capturePoint) {
    conditions.push("capture_point = ?");
    args.push(capturePoint);
  }

  if (search) {
    conditions.push("(email LIKE ? OR name LIKE ? OR company LIKE ?)");
    const searchPattern = `%${search}%`;
    args.push(searchPattern, searchPattern, searchPattern);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Validate sort column to prevent SQL injection
  const validSortColumns = ["captured_at", "email", "reports_viewed", "last_active_at"];
  const safeSort = validSortColumns.includes(sortBy) ? sortBy : "captured_at";
  const safeOrder = sortOrder === "asc" ? "ASC" : "DESC";

  // Get total count
  const countResult = await db.execute({
    sql: `SELECT COUNT(*) as count FROM leads ${whereClause}`,
    args,
  });

  const total = (countResult.rows[0].count as number) || 0;

  // Get paginated results
  const leadsResult = await db.execute({
    sql: `
      SELECT * FROM leads
      ${whereClause}
      ORDER BY ${safeSort} ${safeOrder}
      LIMIT ? OFFSET ?
    `,
    args: [...args, limit, offset],
  });

  const leads = leadsResult.rows.map(mapRowToLead);

  return { leads, total };
}

/**
 * Update lead status or notes
 */
export async function updateLead(
  leadId: string,
  updates: { status?: string; notes?: string }
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();

  const setClauses: string[] = ["updated_at = ?"];
  const args: (string | null)[] = [now];

  if (updates.status !== undefined) {
    setClauses.push("status = ?");
    args.push(updates.status);
  }

  if (updates.notes !== undefined) {
    setClauses.push("notes = ?");
    args.push(updates.notes);
  }

  args.push(leadId);

  await db.execute({
    sql: `UPDATE leads SET ${setClauses.join(", ")} WHERE id = ?`,
    args,
  });
}

/**
 * Get reports accessed by a lead
 */
export async function getLeadReportAccess(
  leadId: string
): Promise<Array<{ auditId: string; firstAccessedAt: string; accessCount: number }>> {
  const db = await getDb();

  const result = await db.execute({
    sql: `
      SELECT audit_id, first_accessed_at, access_count
      FROM lead_report_access
      WHERE lead_id = ?
      ORDER BY last_accessed_at DESC
    `,
    args: [leadId],
  });

  return result.rows.map((row) => ({
    auditId: row.audit_id as string,
    firstAccessedAt: row.first_accessed_at as string,
    accessCount: row.access_count as number,
  }));
}

/**
 * Delete a lead
 */
export async function deleteLead(leadId: string): Promise<void> {
  const db = await getDb();

  // Delete access records first (foreign key)
  await db.execute({
    sql: `DELETE FROM lead_report_access WHERE lead_id = ?`,
    args: [leadId],
  });

  // Delete lead
  await db.execute({
    sql: `DELETE FROM leads WHERE id = ?`,
    args: [leadId],
  });
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function mapRowToLead(row: Record<string, unknown>): Lead {
  return {
    id: row.id as string,
    email: row.email as string,
    name: row.name as string | null,
    company: row.company as string | null,
    phone: row.phone as string | null,
    capturedAt: row.captured_at as string,
    capturePoint: row.capture_point as string,
    firstAuditId: row.first_audit_id as string | null,
    utmSource: row.utm_source as string | null,
    utmMedium: row.utm_medium as string | null,
    utmCampaign: row.utm_campaign as string | null,
    referrer: row.referrer as string | null,
    reportsViewed: (row.reports_viewed as number) || 0,
    lastActiveAt: row.last_active_at as string | null,
    status: (row.status as string) || "new",
    notes: row.notes as string | null,
    consentRecordedAt: row.consent_recorded_at as string | null,
  };
}
