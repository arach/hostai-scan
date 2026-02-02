import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import fs from "fs";
import path from "path";

interface Migration {
  name: string;
  appliedAt: string | null;
  status: "applied" | "pending" | "error";
  error?: string;
}

interface MigrationFile {
  name: string;
  sql: string;
}

const MIGRATIONS_DIR = path.join(process.cwd(), "src/lib/migrations");

function getMigrationFiles(): MigrationFile[] {
  try {
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    return files.map((file) => ({
      name: file.replace(".sql", ""),
      sql: fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8"),
    }));
  } catch (error) {
    console.error("Failed to read migration files:", error);
    return [];
  }
}

async function ensureMigrationsTable(): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL
    )
  `);
}

async function getAppliedMigrations(): Promise<Map<string, string>> {
  const result = await db.execute(`SELECT name, applied_at FROM _migrations ORDER BY applied_at ASC`);
  const map = new Map<string, string>();
  for (const row of result.rows) {
    map.set(row.name as string, row.applied_at as string);
  }
  return map;
}

async function columnExists(tableName: string, columnName: string): Promise<boolean> {
  try {
    const result = await db.execute(`PRAGMA table_info(${tableName})`);
    return result.rows.some((row) => row.name === columnName);
  } catch {
    return false;
  }
}

async function runMigrationSql(sql: string): Promise<{ success: boolean; error?: string }> {
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  for (const statement of statements) {
    try {
      if (!statement || statement.startsWith("--")) continue;

      // Handle ALTER TABLE ADD COLUMN - check if column exists first
      const alterMatch = statement.match(/ALTER\s+TABLE\s+(\w+)\s+ADD\s+COLUMN\s+(\w+)/i);
      if (alterMatch) {
        const [, tableName, columnName] = alterMatch;
        if (await columnExists(tableName, columnName)) {
          console.log(`[Migrations] Column ${tableName}.${columnName} already exists, skipping`);
          continue;
        }
      }

      await db.execute(statement);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      if (errorMsg.includes("duplicate column name") || errorMsg.includes("already exists")) {
        console.log(`[Migrations] Object already exists, skipping`);
        continue;
      }

      return { success: false, error: errorMsg };
    }
  }

  return { success: true };
}

export async function GET() {
  try {
    // Ensure migrations table exists
    await ensureMigrationsTable();

    // Get applied migrations from database
    const appliedMigrations = await getAppliedMigrations();

    // Get available migration files
    const migrationFiles = getMigrationFiles();

    // Combine into a list with status
    const migrations: Migration[] = migrationFiles.map((file) => {
      const appliedAt = appliedMigrations.get(file.name);
      return {
        name: file.name,
        appliedAt: appliedAt || null,
        status: appliedAt ? "applied" : "pending",
      };
    });

    // Add any applied migrations that don't have files (orphaned)
    for (const [name, appliedAt] of appliedMigrations) {
      if (!migrationFiles.some((f) => f.name === name)) {
        migrations.push({
          name,
          appliedAt,
          status: "applied",
          error: "Migration file not found",
        });
      }
    }

    // Sort by name
    migrations.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      migrations,
      summary: {
        total: migrations.length,
        applied: migrations.filter((m) => m.status === "applied").length,
        pending: migrations.filter((m) => m.status === "pending").length,
      },
    });
  } catch (error) {
    console.error("Failed to fetch migrations:", error);
    return NextResponse.json(
      { error: "Failed to fetch migrations" },
      { status: 500 }
    );
  }
}

export async function POST() {
  const applied: string[] = [];
  const skipped: string[] = [];
  const errors: { name: string; error: string }[] = [];

  try {
    // Ensure migrations table exists
    await ensureMigrationsTable();

    // Get already applied migrations
    const appliedMigrations = await getAppliedMigrations();

    // Get migration files
    const migrationFiles = getMigrationFiles();

    console.log(`[Migrations API] Found ${migrationFiles.length} migration files`);

    for (const file of migrationFiles) {
      if (appliedMigrations.has(file.name)) {
        console.log(`[Migrations API] Skipping ${file.name} (already applied)`);
        skipped.push(file.name);
        continue;
      }

      console.log(`[Migrations API] Applying ${file.name}...`);

      const result = await runMigrationSql(file.sql);

      if (result.success) {
        // Record the migration
        await db.execute({
          sql: `INSERT INTO _migrations (name, applied_at) VALUES (?, ?)`,
          args: [file.name, new Date().toISOString()],
        });
        applied.push(file.name);
        console.log(`[Migrations API] Applied ${file.name} successfully`);
      } else {
        errors.push({ name: file.name, error: result.error || "Unknown error" });
        console.error(`[Migrations API] Failed to apply ${file.name}: ${result.error}`);
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      applied,
      skipped,
      errors,
    });
  } catch (error) {
    console.error("Failed to run migrations:", error);
    return NextResponse.json(
      {
        success: false,
        applied,
        skipped,
        errors: [...errors, { name: "_system", error: error instanceof Error ? error.message : "Unknown error" }],
      },
      { status: 500 }
    );
  }
}
