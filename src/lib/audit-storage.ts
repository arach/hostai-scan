import { db, initializeDatabase } from "./db";

// Track if schema has been initialized
let schemaInitialized = false;

async function ensureSchema() {
  if (schemaInitialized) {
    console.log("[Storage] Schema already initialized, skipping");
    return;
  }

  console.log("[Storage] Initializing schema...");

  try {
    // Run migrations first
    await initializeDatabase();

    await db.execute(`
      CREATE TABLE IF NOT EXISTS audits (
        id TEXT PRIMARY KEY,
        domain TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'completed',
        created_at TEXT NOT NULL,
        completed_at TEXT,
        result TEXT,
        error TEXT,
        score INTEGER
      )
    `);
    console.log("[Storage] Table created");

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_audits_domain ON audits(domain)
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_audits_created ON audits(created_at DESC)
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_audits_score ON audits(score)
    `);
    console.log("[Storage] Indexes created");

    schemaInitialized = true;
    console.log("[Storage] Schema initialized successfully");
  } catch (error) {
    console.error("[Storage] Schema initialization failed:", error);
    throw error;
  }
}

export interface StoredAudit {
  id: string;
  domain: string;
  createdAt: string;
  completedAt: string;
  result: unknown;
}

// Generate a slug-friendly ID from domain
function generateAuditId(domain: string): string {
  const slug = domain.replace(/[^a-z0-9]/gi, "-").toLowerCase();
  const timestamp = Date.now();
  return `${slug}-${timestamp}`;
}

// Save an audit result
export async function saveAudit(
  domain: string,
  result: unknown
): Promise<string> {
  console.log(`[Storage] saveAudit called for domain: ${domain}`);

  try {
    await ensureSchema();
    const id = generateAuditId(domain);
    const now = new Date().toISOString();
    const resultJson = JSON.stringify(result);

    console.log(`[Storage] Inserting audit ${id}, result size: ${resultJson.length} bytes`);

    await db.execute({
      sql: `INSERT INTO audits (id, domain, status, created_at, completed_at, result)
            VALUES (?, ?, 'completed', ?, ?, ?)`,
      args: [id, domain, now, now, resultJson],
    });

    console.log(`[Storage] Audit saved successfully: ${id}`);
    return id;
  } catch (error) {
    console.error(`[Storage] saveAudit failed:`, error);
    throw error;
  }
}

// Load an audit by ID
export async function loadAudit(id: string): Promise<StoredAudit | null> {
  await ensureSchema();
  const result = await db.execute({
    sql: `SELECT id, domain, created_at, completed_at, result FROM audits WHERE id = ?`,
    args: [id],
  });

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id as string,
    domain: row.domain as string,
    createdAt: row.created_at as string,
    completedAt: row.completed_at as string,
    result: JSON.parse(row.result as string),
  };
}

// List recent audits for a domain
export async function listAuditsForDomain(
  domain: string,
  limit = 10
): Promise<StoredAudit[]> {
  await ensureSchema();
  const result = await db.execute({
    sql: `SELECT id, domain, created_at, completed_at, result
          FROM audits
          WHERE domain = ?
          ORDER BY created_at DESC
          LIMIT ?`,
    args: [domain, limit],
  });

  return result.rows.map((row) => ({
    id: row.id as string,
    domain: row.domain as string,
    createdAt: row.created_at as string,
    completedAt: row.completed_at as string,
    result: JSON.parse(row.result as string),
  }));
}

// List all recent audits
export async function listRecentAudits(limit = 20): Promise<StoredAudit[]> {
  await ensureSchema();
  const result = await db.execute({
    sql: `SELECT id, domain, created_at, completed_at, result
          FROM audits
          ORDER BY created_at DESC
          LIMIT ?`,
    args: [limit],
  });

  return result.rows.map((row) => ({
    id: row.id as string,
    domain: row.domain as string,
    createdAt: row.created_at as string,
    completedAt: row.completed_at as string,
    result: JSON.parse(row.result as string),
  }));
}

// -----------------------------------------------------------------------------
// Enhanced Audit Listing for Table View
// -----------------------------------------------------------------------------

export interface AuditListParams {
  sort?: "score" | "created_at" | "domain" | "views";
  order?: "asc" | "desc";
  status?: "completed" | "pending" | "failed";
  scoreMin?: number;
  scoreMax?: number;
  batchId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AuditListItem {
  id: string;
  domain: string;
  status: string;
  score: number | null;
  createdAt: string;
  completedAt: string | null;
  batchId: string | null;
  viewCount: number;
}

export interface AuditListResult {
  audits: AuditListItem[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * List audits with full sorting, filtering, and pagination
 * Joins with report_views for view counts
 */
export async function listAuditsAdvanced(
  params: AuditListParams
): Promise<AuditListResult> {
  await ensureSchema();

  const {
    sort = "created_at",
    order = "desc",
    status,
    scoreMin,
    scoreMax,
    batchId,
    search,
    page = 1,
    limit = 25,
  } = params;

  // Build WHERE clause
  const conditions: string[] = [];
  const args: (string | number)[] = [];

  if (status) {
    conditions.push("a.status = ?");
    args.push(status);
  }

  if (scoreMin !== undefined) {
    conditions.push("a.score >= ?");
    args.push(scoreMin);
  }

  if (scoreMax !== undefined) {
    conditions.push("a.score <= ?");
    args.push(scoreMax);
  }

  if (batchId) {
    conditions.push("a.batch_id = ?");
    args.push(batchId);
  }

  if (search) {
    conditions.push("a.domain LIKE ?");
    args.push(`%${search}%`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Validate sort column
  const sortMap: Record<string, string> = {
    score: "a.score",
    created_at: "a.created_at",
    domain: "a.domain",
    views: "view_count",
  };
  const safeSort = sortMap[sort] || "a.created_at";
  const safeOrder = order === "asc" ? "ASC" : "DESC";

  // Handle NULL scores in sorting (put at end)
  const orderClause =
    sort === "score"
      ? `ORDER BY a.score IS NULL, ${safeSort} ${safeOrder}`
      : `ORDER BY ${safeSort} ${safeOrder}`;

  // Get total count
  const countResult = await db.execute({
    sql: `SELECT COUNT(*) as count FROM audits a ${whereClause}`,
    args,
  });

  const total = (countResult.rows[0].count as number) || 0;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  // Get paginated results with view counts
  const auditsResult = await db.execute({
    sql: `
      SELECT
        a.id,
        a.domain,
        a.status,
        a.score,
        a.created_at,
        a.completed_at,
        a.batch_id,
        COALESCE(v.view_count, 0) as view_count
      FROM audits a
      LEFT JOIN (
        SELECT audit_id, COUNT(*) as view_count
        FROM report_views
        GROUP BY audit_id
      ) v ON a.id = v.audit_id
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `,
    args: [...args, limit, offset],
  });

  const audits: AuditListItem[] = auditsResult.rows.map((row) => ({
    id: row.id as string,
    domain: row.domain as string,
    status: (row.status as string) || "completed",
    score: row.score as number | null,
    createdAt: row.created_at as string,
    completedAt: row.completed_at as string | null,
    batchId: row.batch_id as string | null,
    viewCount: (row.view_count as number) || 0,
  }));

  return { audits, total, page, totalPages };
}

/**
 * Delete multiple audits by ID
 */
export async function deleteAudits(auditIds: string[]): Promise<number> {
  await ensureSchema();

  if (auditIds.length === 0) return 0;

  const placeholders = auditIds.map(() => "?").join(",");

  // Delete related records first
  await db.execute({
    sql: `DELETE FROM report_views WHERE audit_id IN (${placeholders})`,
    args: auditIds,
  });

  await db.execute({
    sql: `DELETE FROM report_clicks WHERE audit_id IN (${placeholders})`,
    args: auditIds,
  });

  await db.execute({
    sql: `DELETE FROM lead_report_access WHERE audit_id IN (${placeholders})`,
    args: auditIds,
  });

  // Delete audits
  const result = await db.execute({
    sql: `DELETE FROM audits WHERE id IN (${placeholders})`,
    args: auditIds,
  });

  return result.rowsAffected;
}

/**
 * Get audits as CSV export data
 */
export async function exportAudits(
  params: Omit<AuditListParams, "page" | "limit">
): Promise<AuditListItem[]> {
  // Use a large limit for export
  const result = await listAuditsAdvanced({ ...params, page: 1, limit: 10000 });
  return result.audits;
}
