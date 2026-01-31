import { promises as fs } from "fs";
import path from "path";

// Store audits in a data directory
const AUDITS_DIR = path.join(process.cwd(), "data", "audits");

export interface StoredAudit {
  id: string;
  domain: string;
  createdAt: string;
  completedAt: string;
  result: unknown;
}

// Ensure the audits directory exists
async function ensureDir() {
  try {
    await fs.mkdir(AUDITS_DIR, { recursive: true });
  } catch {
    // Directory likely exists
  }
}

// Generate a slug-friendly ID from domain
function generateAuditId(domain: string): string {
  const slug = domain.replace(/[^a-z0-9]/gi, "-").toLowerCase();
  const timestamp = Date.now();
  return `${slug}-${timestamp}`;
}

// Save an audit result to JSON file
export async function saveAudit(
  domain: string,
  result: unknown
): Promise<string> {
  await ensureDir();

  const id = generateAuditId(domain);
  const audit: StoredAudit = {
    id,
    domain,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    result,
  };

  const filePath = path.join(AUDITS_DIR, `${id}.json`);
  await fs.writeFile(filePath, JSON.stringify(audit, null, 2), "utf-8");

  console.log(`Audit saved: ${filePath}`);
  return id;
}

// Load an audit by ID
export async function loadAudit(id: string): Promise<StoredAudit | null> {
  try {
    const filePath = path.join(AUDITS_DIR, `${id}.json`);
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as StoredAudit;
  } catch {
    return null;
  }
}

// List recent audits for a domain
export async function listAuditsForDomain(
  domain: string,
  limit = 10
): Promise<StoredAudit[]> {
  await ensureDir();

  try {
    const files = await fs.readdir(AUDITS_DIR);
    const slug = domain.replace(/[^a-z0-9]/gi, "-").toLowerCase();

    // Filter files that match the domain
    const matchingFiles = files
      .filter((f) => f.startsWith(slug) && f.endsWith(".json"))
      .sort()
      .reverse()
      .slice(0, limit);

    const audits: StoredAudit[] = [];
    for (const file of matchingFiles) {
      try {
        const content = await fs.readFile(
          path.join(AUDITS_DIR, file),
          "utf-8"
        );
        audits.push(JSON.parse(content));
      } catch {
        // Skip corrupted files
      }
    }

    return audits;
  } catch {
    return [];
  }
}

// List all recent audits
export async function listRecentAudits(limit = 20): Promise<StoredAudit[]> {
  await ensureDir();

  try {
    const files = await fs.readdir(AUDITS_DIR);

    // Get file stats for sorting by modification time
    const fileStats = await Promise.all(
      files
        .filter((f) => f.endsWith(".json"))
        .map(async (f) => {
          const filePath = path.join(AUDITS_DIR, f);
          const stat = await fs.stat(filePath);
          return { file: f, mtime: stat.mtime };
        })
    );

    // Sort by modification time, newest first
    const sortedFiles = fileStats
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())
      .slice(0, limit)
      .map((f) => f.file);

    const audits: StoredAudit[] = [];
    for (const file of sortedFiles) {
      try {
        const content = await fs.readFile(
          path.join(AUDITS_DIR, file),
          "utf-8"
        );
        audits.push(JSON.parse(content));
      } catch {
        // Skip corrupted files
      }
    }

    return audits;
  } catch {
    return [];
  }
}
