import { createClient } from "@libsql/client";

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

export const db = createClient(
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

