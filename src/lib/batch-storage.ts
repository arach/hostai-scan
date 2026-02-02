/**
 * Batch Storage for Bulk Import
 *
 * Manages import batches in the database.
 */

import { db, initializeDatabase } from "./db";

export interface ImportBatch {
  id: string;
  name: string | null;
  source: "paste" | "file" | "api";
  filename: string | null;
  totalDomains: number;
  completedCount: number;
  failedCount: number;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  createdBy: string | null;
}

export interface CreateBatchInput {
  name?: string;
  source: "paste" | "file" | "api";
  filename?: string;
  totalDomains: number;
  createdBy?: string;
}

export interface UpdateBatchInput {
  name?: string;
  status?: ImportBatch["status"];
  completedCount?: number;
  failedCount?: number;
  completedAt?: string;
}

export interface ListBatchesOptions {
  limit?: number;
  offset?: number;
  status?: ImportBatch["status"];
}

// Track if schema has been ensured
let schemaEnsured = false;

async function ensureSchema() {
  if (schemaEnsured) return;

  // Run migrations which will create the import_batches table
  await initializeDatabase();
  schemaEnsured = true;
}

/**
 * Generate a unique batch ID
 */
function generateBatchId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `batch_${timestamp}_${random}`;
}

/**
 * Create a new import batch
 */
export async function createBatch(input: CreateBatchInput): Promise<ImportBatch> {
  await ensureSchema();

  const id = generateBatchId();
  const now = new Date().toISOString();

  await db.execute({
    sql: `INSERT INTO import_batches
          (id, name, source, filename, total_domains, completed_count, failed_count, status, created_at, updated_at, created_by)
          VALUES (?, ?, ?, ?, ?, 0, 0, 'pending', ?, ?, ?)`,
    args: [
      id,
      input.name || null,
      input.source,
      input.filename || null,
      input.totalDomains,
      now,
      now,
      input.createdBy || null,
    ],
  });

  console.log(`[BatchStorage] Created batch ${id} with ${input.totalDomains} domains`);

  return {
    id,
    name: input.name || null,
    source: input.source,
    filename: input.filename || null,
    totalDomains: input.totalDomains,
    completedCount: 0,
    failedCount: 0,
    status: "pending",
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    createdBy: input.createdBy || null,
  };
}

/**
 * Get a batch by ID
 */
export async function getBatch(id: string): Promise<ImportBatch | null> {
  await ensureSchema();

  const result = await db.execute({
    sql: `SELECT * FROM import_batches WHERE id = ?`,
    args: [id],
  });

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return mapRowToBatch(row);
}

/**
 * Update a batch
 */
export async function updateBatch(
  id: string,
  updates: UpdateBatchInput
): Promise<ImportBatch | null> {
  await ensureSchema();

  const setClauses: string[] = [];
  const args: (string | number | null)[] = [];

  if (updates.name !== undefined) {
    setClauses.push("name = ?");
    args.push(updates.name);
  }
  if (updates.status !== undefined) {
    setClauses.push("status = ?");
    args.push(updates.status);
  }
  if (updates.completedCount !== undefined) {
    setClauses.push("completed_count = ?");
    args.push(updates.completedCount);
  }
  if (updates.failedCount !== undefined) {
    setClauses.push("failed_count = ?");
    args.push(updates.failedCount);
  }
  if (updates.completedAt !== undefined) {
    setClauses.push("completed_at = ?");
    args.push(updates.completedAt);
  }

  // Always update updated_at
  setClauses.push("updated_at = ?");
  args.push(new Date().toISOString());

  if (setClauses.length === 1) {
    // Only updated_at, nothing else to update
    return getBatch(id);
  }

  args.push(id);

  await db.execute({
    sql: `UPDATE import_batches SET ${setClauses.join(", ")} WHERE id = ?`,
    args,
  });

  return getBatch(id);
}

/**
 * Increment completed or failed count atomically
 */
export async function incrementBatchCount(
  id: string,
  field: "completed" | "failed"
): Promise<void> {
  await ensureSchema();

  const column = field === "completed" ? "completed_count" : "failed_count";
  const now = new Date().toISOString();

  await db.execute({
    sql: `UPDATE import_batches
          SET ${column} = ${column} + 1, updated_at = ?
          WHERE id = ?`,
    args: [now, id],
  });
}

/**
 * Mark batch as completed if all domains are processed
 */
export async function checkAndCompleteBatch(id: string): Promise<ImportBatch | null> {
  await ensureSchema();

  const batch = await getBatch(id);
  if (!batch) return null;

  const processedCount = batch.completedCount + batch.failedCount;
  if (processedCount >= batch.totalDomains && batch.status === "processing") {
    const now = new Date().toISOString();
    const newStatus = batch.failedCount === batch.totalDomains ? "failed" : "completed";

    return updateBatch(id, {
      status: newStatus,
      completedAt: now,
    });
  }

  return batch;
}

/**
 * List batches with pagination
 */
export async function listBatches(
  options: ListBatchesOptions = {}
): Promise<{ batches: ImportBatch[]; total: number }> {
  await ensureSchema();

  const limit = options.limit || 20;
  const offset = options.offset || 0;

  let whereClause = "";
  const args: (string | number)[] = [];

  if (options.status) {
    whereClause = "WHERE status = ?";
    args.push(options.status);
  }

  // Get total count
  const countResult = await db.execute({
    sql: `SELECT COUNT(*) as count FROM import_batches ${whereClause}`,
    args,
  });
  const total = (countResult.rows[0].count as number) || 0;

  // Get batches
  const result = await db.execute({
    sql: `SELECT * FROM import_batches ${whereClause}
          ORDER BY created_at DESC
          LIMIT ? OFFSET ?`,
    args: [...args, limit, offset],
  });

  const batches = result.rows.map(mapRowToBatch);

  return { batches, total };
}

/**
 * Get audits for a batch
 */
export async function getAuditsForBatch(
  batchId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<{ auditId: string; domain: string; position: number; status: string }[]> {
  await ensureSchema();

  const limit = options.limit || 100;
  const offset = options.offset || 0;

  const result = await db.execute({
    sql: `SELECT id, domain, batch_position, status
          FROM audits
          WHERE batch_id = ?
          ORDER BY batch_position ASC
          LIMIT ? OFFSET ?`,
    args: [batchId, limit, offset],
  });

  return result.rows.map((row) => ({
    auditId: row.id as string,
    domain: row.domain as string,
    position: row.batch_position as number,
    status: row.status as string,
  }));
}

/**
 * Delete a batch (and optionally its audits)
 */
export async function deleteBatch(
  id: string,
  deleteAudits = false
): Promise<boolean> {
  await ensureSchema();

  if (deleteAudits) {
    await db.execute({
      sql: `DELETE FROM audits WHERE batch_id = ?`,
      args: [id],
    });
  } else {
    // Just unlink audits from batch
    await db.execute({
      sql: `UPDATE audits SET batch_id = NULL, batch_position = NULL WHERE batch_id = ?`,
      args: [id],
    });
  }

  const result = await db.execute({
    sql: `DELETE FROM import_batches WHERE id = ?`,
    args: [id],
  });

  return result.rowsAffected > 0;
}

// Helper function to map database row to ImportBatch
function mapRowToBatch(row: Record<string, unknown>): ImportBatch {
  return {
    id: row.id as string,
    name: row.name as string | null,
    source: row.source as ImportBatch["source"],
    filename: row.filename as string | null,
    totalDomains: row.total_domains as number,
    completedCount: row.completed_count as number,
    failedCount: row.failed_count as number,
    status: row.status as ImportBatch["status"],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    completedAt: row.completed_at as string | null,
    createdBy: row.created_by as string | null,
  };
}
