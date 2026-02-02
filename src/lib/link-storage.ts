import { db, initializeDatabase } from "./db";
import { createHmac, randomBytes } from "crypto";

// Track if schema has been initialized
let linkSchemaInitialized = false;

async function ensureLinkSchema() {
  if (linkSchemaInitialized) {
    return;
  }

  // Run migrations which include the report_links table
  await initializeDatabase();
  linkSchemaInitialized = true;
}

export interface ReportLink {
  auditId: string;
  customSlug: string | null;
  expiresAt: string | null;
  accessToken: string | null;
  defaultUtmSource: string | null;
  defaultUtmMedium: string | null;
  defaultUtmCampaign: string | null;
  linkCopies: number;
  qrDownloads: number;
  updatedAt: string;
}

export interface LinkSettings {
  customSlug?: string | null;
  expiresAt?: string | null;
  defaultUtmSource?: string | null;
  defaultUtmMedium?: string | null;
  defaultUtmCampaign?: string | null;
}

// Secret for signing tokens - should be in environment variable
const TOKEN_SECRET = process.env.LINK_TOKEN_SECRET || "gethost-link-secret-change-in-production";

/**
 * Create or update link settings for an audit
 */
export async function createOrUpdateLink(
  auditId: string,
  data: LinkSettings
): Promise<ReportLink> {
  await ensureLinkSchema();

  // Check if link exists
  const existing = await getLinkByAuditId(auditId);
  const now = new Date().toISOString();

  if (existing) {
    // Update existing link
    const updates: string[] = [];
    const args: (string | null)[] = [];

    if (data.customSlug !== undefined) {
      updates.push("custom_slug = ?");
      args.push(data.customSlug);
    }
    if (data.expiresAt !== undefined) {
      updates.push("expires_at = ?");
      args.push(data.expiresAt);
    }
    if (data.defaultUtmSource !== undefined) {
      updates.push("default_utm_source = ?");
      args.push(data.defaultUtmSource);
    }
    if (data.defaultUtmMedium !== undefined) {
      updates.push("default_utm_medium = ?");
      args.push(data.defaultUtmMedium);
    }
    if (data.defaultUtmCampaign !== undefined) {
      updates.push("default_utm_campaign = ?");
      args.push(data.defaultUtmCampaign);
    }

    updates.push("updated_at = ?");
    args.push(now);
    args.push(auditId);

    await db.execute({
      sql: `UPDATE report_links SET ${updates.join(", ")} WHERE audit_id = ?`,
      args,
    });
  } else {
    // Insert new link
    await db.execute({
      sql: `INSERT INTO report_links (
        audit_id, custom_slug, expires_at,
        default_utm_source, default_utm_medium, default_utm_campaign,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        auditId,
        data.customSlug ?? null,
        data.expiresAt ?? null,
        data.defaultUtmSource ?? null,
        data.defaultUtmMedium ?? null,
        data.defaultUtmCampaign ?? null,
        now,
      ],
    });
  }

  // Return the updated/created link
  const link = await getLinkByAuditId(auditId);
  if (!link) {
    throw new Error("Failed to create or update link");
  }
  return link;
}

/**
 * Get link settings by audit ID
 */
export async function getLinkByAuditId(
  auditId: string
): Promise<ReportLink | null> {
  await ensureLinkSchema();

  const result = await db.execute({
    sql: `SELECT * FROM report_links WHERE audit_id = ?`,
    args: [auditId],
  });

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    auditId: row.audit_id as string,
    customSlug: row.custom_slug as string | null,
    expiresAt: row.expires_at as string | null,
    accessToken: row.access_token as string | null,
    defaultUtmSource: row.default_utm_source as string | null,
    defaultUtmMedium: row.default_utm_medium as string | null,
    defaultUtmCampaign: row.default_utm_campaign as string | null,
    linkCopies: (row.link_copies as number) || 0,
    qrDownloads: (row.qr_downloads as number) || 0,
    updatedAt: row.updated_at as string,
  };
}

/**
 * Resolve a custom slug to an audit ID
 */
export async function getLinkBySlug(
  slug: string
): Promise<ReportLink | null> {
  await ensureLinkSchema();

  const result = await db.execute({
    sql: `SELECT * FROM report_links WHERE custom_slug = ?`,
    args: [slug],
  });

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    auditId: row.audit_id as string,
    customSlug: row.custom_slug as string | null,
    expiresAt: row.expires_at as string | null,
    accessToken: row.access_token as string | null,
    defaultUtmSource: row.default_utm_source as string | null,
    defaultUtmMedium: row.default_utm_medium as string | null,
    defaultUtmCampaign: row.default_utm_campaign as string | null,
    linkCopies: (row.link_copies as number) || 0,
    qrDownloads: (row.qr_downloads as number) || 0,
    updatedAt: row.updated_at as string,
  };
}

/**
 * Increment a stat counter for a link (copies or downloads)
 */
export async function incrementLinkStat(
  auditId: string,
  field: "link_copies" | "qr_downloads"
): Promise<void> {
  await ensureLinkSchema();

  // First ensure the link exists
  const existing = await getLinkByAuditId(auditId);
  if (!existing) {
    // Create a minimal link record
    await db.execute({
      sql: `INSERT INTO report_links (audit_id, updated_at) VALUES (?, ?)`,
      args: [auditId, new Date().toISOString()],
    });
  }

  await db.execute({
    sql: `UPDATE report_links SET ${field} = ${field} + 1, updated_at = ? WHERE audit_id = ?`,
    args: [new Date().toISOString(), auditId],
  });
}

/**
 * Check if a custom slug is available
 */
export async function isSlugAvailable(
  slug: string,
  excludeAuditId?: string
): Promise<boolean> {
  await ensureLinkSchema();

  let sql = `SELECT COUNT(*) as count FROM report_links WHERE custom_slug = ?`;
  const args: string[] = [slug];

  if (excludeAuditId) {
    sql += ` AND audit_id != ?`;
    args.push(excludeAuditId);
  }

  const result = await db.execute({ sql, args });
  const count = (result.rows[0].count as number) || 0;
  return count === 0;
}

/**
 * Validate that a slug is URL-safe
 */
export function isValidSlug(slug: string): boolean {
  // Only allow lowercase letters, numbers, and hyphens
  // Must start and end with alphanumeric, 3-50 chars
  const slugPattern = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;
  return slugPattern.test(slug);
}

/**
 * Check if a report link has expired
 */
export function isLinkExpired(link: ReportLink): boolean {
  if (!link.expiresAt) {
    return false;
  }
  const expiresAt = new Date(link.expiresAt);
  return expiresAt < new Date();
}

// ============================================================================
// Token Generation and Validation (Simple JWT-like signed tokens)
// ============================================================================

interface TokenPayload {
  auditId: string;
  expiresAt: string;
  issuedAt: string;
  nonce: string;
}

/**
 * Generate a signed access token for a report
 */
export function generateSignedToken(
  auditId: string,
  expiresAt: string
): string {
  const payload: TokenPayload = {
    auditId,
    expiresAt,
    issuedAt: new Date().toISOString(),
    nonce: randomBytes(8).toString("hex"),
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", TOKEN_SECRET)
    .update(payloadBase64)
    .digest("base64url");

  return `${payloadBase64}.${signature}`;
}

/**
 * Validate an access token and extract the payload
 */
export function validateToken(
  token: string
): { valid: boolean; payload?: TokenPayload; error?: string } {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) {
      return { valid: false, error: "Invalid token format" };
    }

    const [payloadBase64, providedSignature] = parts;

    // Verify signature
    const expectedSignature = createHmac("sha256", TOKEN_SECRET)
      .update(payloadBase64)
      .digest("base64url");

    if (providedSignature !== expectedSignature) {
      return { valid: false, error: "Invalid token signature" };
    }

    // Parse payload
    const payload: TokenPayload = JSON.parse(
      Buffer.from(payloadBase64, "base64url").toString("utf-8")
    );

    // Check expiration
    const expiresAt = new Date(payload.expiresAt);
    if (expiresAt < new Date()) {
      return { valid: false, error: "Token has expired" };
    }

    return { valid: true, payload };
  } catch (error) {
    return { valid: false, error: "Failed to validate token" };
  }
}

/**
 * Store a generated token for a report link
 */
export async function storeAccessToken(
  auditId: string,
  token: string
): Promise<void> {
  await ensureLinkSchema();

  const existing = await getLinkByAuditId(auditId);
  const now = new Date().toISOString();

  if (existing) {
    await db.execute({
      sql: `UPDATE report_links SET access_token = ?, updated_at = ? WHERE audit_id = ?`,
      args: [token, now, auditId],
    });
  } else {
    await db.execute({
      sql: `INSERT INTO report_links (audit_id, access_token, updated_at) VALUES (?, ?, ?)`,
      args: [auditId, token, now],
    });
  }
}
