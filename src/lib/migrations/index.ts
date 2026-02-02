import { db } from "../db";
import fs from "fs";
import path from "path";

// Track if migrations have already run in this process
let migrationsRun = false;

/**
 * Ensures the migrations tracking table exists
 */
async function ensureMigrationsTable(): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL
    )
  `);
}

/**
 * Gets list of already applied migrations
 */
async function getAppliedMigrations(): Promise<Set<string>> {
  const result = await db.execute(`SELECT name FROM _migrations`);
  return new Set(result.rows.map((row) => row.name as string));
}

/**
 * Records a migration as applied
 */
async function recordMigration(name: string): Promise<void> {
  await db.execute({
    sql: `INSERT INTO _migrations (name, applied_at) VALUES (?, ?)`,
    args: [name, new Date().toISOString()],
  });
}

/**
 * Checks if a column exists in a table
 */
async function columnExists(
  tableName: string,
  columnName: string
): Promise<boolean> {
  try {
    const result = await db.execute(`PRAGMA table_info(${tableName})`);
    return result.rows.some((row) => row.name === columnName);
  } catch {
    return false;
  }
}

/**
 * Runs a single migration SQL file
 * Handles common SQLite limitations (like ALTER TABLE ADD COLUMN IF NOT EXISTS)
 */
async function runMigrationSql(
  name: string,
  sql: string
): Promise<{ success: boolean; error?: string }> {
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  for (const statement of statements) {
    try {
      // Skip empty statements
      if (!statement || statement.startsWith("--")) continue;

      // Handle ALTER TABLE ADD COLUMN - check if column exists first
      const alterMatch = statement.match(
        /ALTER\s+TABLE\s+(\w+)\s+ADD\s+COLUMN\s+(\w+)/i
      );
      if (alterMatch) {
        const [, tableName, columnName] = alterMatch;
        if (await columnExists(tableName, columnName)) {
          console.log(
            `[Migrations] Column ${tableName}.${columnName} already exists, skipping`
          );
          continue;
        }
      }

      await db.execute(statement);
    } catch (error) {
      // Some errors are expected (e.g., duplicate column)
      const errorMsg = error instanceof Error ? error.message : String(error);

      // Ignore "duplicate column" errors for ALTER TABLE
      if (errorMsg.includes("duplicate column name")) {
        console.log(`[Migrations] Column already exists, skipping`);
        continue;
      }

      // Ignore "table already exists" for CREATE TABLE IF NOT EXISTS
      if (errorMsg.includes("already exists")) {
        console.log(`[Migrations] Object already exists, skipping`);
        continue;
      }

      return { success: false, error: errorMsg };
    }
  }

  return { success: true };
}

/**
 * Runs all pending migrations in order
 * Migrations are read from the migrations folder and executed in alphabetical order
 */
export async function runMigrations(): Promise<{
  applied: string[];
  skipped: string[];
  errors: { name: string; error: string }[];
}> {
  // Prevent duplicate runs in the same process
  if (migrationsRun) {
    console.log("[Migrations] Already run in this process, skipping");
    return { applied: [], skipped: [], errors: [] };
  }

  console.log("[Migrations] Starting migration check...");

  const applied: string[] = [];
  const skipped: string[] = [];
  const errors: { name: string; error: string }[] = [];

  try {
    // Ensure migrations tracking table exists
    await ensureMigrationsTable();

    // Get already applied migrations
    const appliedSet = await getAppliedMigrations();

    // Get migration files from the migrations directory
    const migrationsDir = path.join(__dirname);
    let migrationFiles: string[];

    try {
      migrationFiles = fs
        .readdirSync(migrationsDir)
        .filter((f) => f.endsWith(".sql"))
        .sort(); // Sort alphabetically (001_, 002_, etc.)
    } catch {
      // In production (bundled), migrations might be handled differently
      console.log("[Migrations] Could not read migrations directory");
      migrationsRun = true;
      return { applied, skipped, errors };
    }

    console.log(`[Migrations] Found ${migrationFiles.length} migration files`);

    for (const file of migrationFiles) {
      const migrationName = file.replace(".sql", "");

      if (appliedSet.has(migrationName)) {
        console.log(`[Migrations] Skipping ${migrationName} (already applied)`);
        skipped.push(migrationName);
        continue;
      }

      console.log(`[Migrations] Applying ${migrationName}...`);

      const sqlPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(sqlPath, "utf-8");

      const result = await runMigrationSql(migrationName, sql);

      if (result.success) {
        await recordMigration(migrationName);
        applied.push(migrationName);
        console.log(`[Migrations] Applied ${migrationName} successfully`);
      } else {
        errors.push({ name: migrationName, error: result.error || "Unknown error" });
        console.error(`[Migrations] Failed to apply ${migrationName}: ${result.error}`);
        // Don't break - try to apply other migrations
      }
    }

    migrationsRun = true;
    console.log(
      `[Migrations] Complete. Applied: ${applied.length}, Skipped: ${skipped.length}, Errors: ${errors.length}`
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[Migrations] Fatal error: ${errorMsg}`);
    errors.push({ name: "_system", error: errorMsg });
  }

  return { applied, skipped, errors };
}

/**
 * Reset the migrations run flag (useful for testing)
 */
export function resetMigrationsFlag(): void {
  migrationsRun = false;
}
