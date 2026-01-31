import { db } from "./db";

// Track if schema has been initialized
let schemaInitialized = false;

async function ensureSchema() {
  if (schemaInitialized) return;

  await db.execute(`
    CREATE TABLE IF NOT EXISTS audits (
      id TEXT PRIMARY KEY,
      domain TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'completed',
      created_at TEXT NOT NULL,
      completed_at TEXT,
      result TEXT,
      error TEXT
    )
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_audits_domain ON audits(domain)
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_audits_created ON audits(created_at DESC)
  `);

  schemaInitialized = true;
  console.log("Turso schema initialized");
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
  await ensureSchema();
  const id = generateAuditId(domain);
  const now = new Date().toISOString();

  await db.execute({
    sql: `INSERT INTO audits (id, domain, status, created_at, completed_at, result)
          VALUES (?, ?, 'completed', ?, ?, ?)`,
    args: [id, domain, now, now, JSON.stringify(result)],
  });

  console.log(`Audit saved to Turso: ${id}`);
  return id;
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
