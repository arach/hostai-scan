// Job queue backed by Turso for serverless compatibility
import { db } from "./db";

export interface AuditJob {
  id: string;
  domain: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  currentStep: string;
  result: unknown | null;
  error: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

// Ensure jobs table exists
let tableInitialized = false;
async function ensureJobsTable() {
  if (tableInitialized) return;

  await db.execute(`
    CREATE TABLE IF NOT EXISTS audit_jobs (
      id TEXT PRIMARY KEY,
      domain TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      progress INTEGER NOT NULL DEFAULT 0,
      current_step TEXT NOT NULL DEFAULT 'Initializing...',
      result TEXT,
      error TEXT,
      created_at TEXT NOT NULL,
      completed_at TEXT
    )
  `);

  tableInitialized = true;
  console.log("[Queue] Jobs table initialized");
}

export async function createJob(domain: string): Promise<AuditJob> {
  await ensureJobsTable();

  const id = `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date();

  await db.execute({
    sql: `INSERT INTO audit_jobs (id, domain, status, progress, current_step, created_at)
          VALUES (?, ?, 'pending', 0, 'Initializing...', ?)`,
    args: [id, domain, now.toISOString()],
  });

  console.log(`[Queue] Job created: ${id}`);

  return {
    id,
    domain,
    status: "pending",
    progress: 0,
    currentStep: "Initializing...",
    result: null,
    error: null,
    createdAt: now,
    completedAt: null,
  };
}

export async function getJob(id: string): Promise<AuditJob | null> {
  await ensureJobsTable();

  const result = await db.execute({
    sql: `SELECT * FROM audit_jobs WHERE id = ?`,
    args: [id],
  });

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id as string,
    domain: row.domain as string,
    status: row.status as AuditJob["status"],
    progress: row.progress as number,
    currentStep: row.current_step as string,
    result: row.result ? JSON.parse(row.result as string) : null,
    error: row.error as string | null,
    createdAt: new Date(row.created_at as string),
    completedAt: row.completed_at ? new Date(row.completed_at as string) : null,
  };
}

export async function updateJob(id: string, updates: Partial<AuditJob>): Promise<AuditJob | null> {
  await ensureJobsTable();

  const setClauses: string[] = [];
  const args: unknown[] = [];

  if (updates.status !== undefined) {
    setClauses.push("status = ?");
    args.push(updates.status);
  }
  if (updates.progress !== undefined) {
    setClauses.push("progress = ?");
    args.push(updates.progress);
  }
  if (updates.currentStep !== undefined) {
    setClauses.push("current_step = ?");
    args.push(updates.currentStep);
  }
  if (updates.result !== undefined) {
    setClauses.push("result = ?");
    args.push(JSON.stringify(updates.result));
  }
  if (updates.error !== undefined) {
    setClauses.push("error = ?");
    args.push(updates.error);
  }
  if (updates.completedAt !== undefined) {
    setClauses.push("completed_at = ?");
    args.push(updates.completedAt?.toISOString() || null);
  }

  if (setClauses.length === 0) {
    return getJob(id);
  }

  args.push(id);

  await db.execute({
    sql: `UPDATE audit_jobs SET ${setClauses.join(", ")} WHERE id = ?`,
    args,
  });

  return getJob(id);
}

// Clean up old jobs (older than 1 hour)
export async function cleanupOldJobs(): Promise<void> {
  await ensureJobsTable();

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  await db.execute({
    sql: `DELETE FROM audit_jobs WHERE created_at < ?`,
    args: [oneHourAgo],
  });
}
