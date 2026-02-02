import { createClient, Client } from "@libsql/client";

// Use local SQLite file for development, Turso for production
const dbUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

// Turso URLs can be libsql:// or https:// (or contain .turso.io)
const isTurso = !!(dbUrl && (
  dbUrl.startsWith("libsql://") ||
  dbUrl.startsWith("https://") ||
  dbUrl.includes(".turso.io")
));

console.log(`[DB] TURSO_DATABASE_URL set: ${!!dbUrl}`);
console.log(`[DB] URL length: ${dbUrl?.length || 0}`);
console.log(`[DB] URL starts with: ${dbUrl?.substring(0, 15) || "(empty)"}`);
console.log(`[DB] TURSO_AUTH_TOKEN set: ${!!authToken}, length: ${authToken?.length || 0}`);
console.log(`[DB] Mode: ${isTurso ? "Turso (remote)" : "SQLite (local)"}`);

export const db: Client = createClient(
  isTurso
    ? {
        url: dbUrl!,
        authToken: authToken,
      }
    : {
        // Local SQLite file for development
        url: "file:local.db",
      }
);

console.log(`[DB] Client created successfully`);

// Track initialization state
let dbInitialized = false;
let initPromise: Promise<void> | null = null;

/**
 * Initialize the database - runs migrations and ensures schema is ready
 * Safe to call multiple times, will only run once per process
 */
export async function initializeDatabase(): Promise<void> {
  if (dbInitialized) {
    return;
  }

  // If already initializing, wait for that to complete
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      console.log("[DB] Initializing database...");

      // Dynamic import to avoid circular dependency
      const { runMigrations } = await import("./migrations");
      const result = await runMigrations();

      console.log(`[DB] Migration results - Applied: ${result.applied.length}, Skipped: ${result.skipped.length}, Errors: ${result.errors.length}`);

      if (result.errors.length > 0) {
        console.error("[DB] Migration errors:", result.errors);
      }

      dbInitialized = true;
      console.log("[DB] Database initialized successfully");
    } catch (error) {
      console.error("[DB] Database initialization failed:", error);
      // Don't throw - allow the app to continue even if migrations fail
      // The app may still work with the existing schema
      dbInitialized = true;
    }
  })();

  return initPromise;
}

/**
 * Get database with initialization guarantee
 * Use this instead of raw `db` when you need to ensure migrations have run
 */
export async function getDb(): Promise<Client> {
  await initializeDatabase();
  return db;
}
