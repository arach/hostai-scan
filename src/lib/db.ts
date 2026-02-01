import { createClient } from "@libsql/client";

// Use local SQLite file for development, Turso for production
const dbUrl = process.env.TURSO_DATABASE_URL;
const isProduction = dbUrl?.startsWith("libsql://");

console.log(`[DB] TURSO_DATABASE_URL set: ${!!dbUrl}`);
console.log(`[DB] URL prefix: ${dbUrl?.substring(0, 30)}...`);
console.log(`[DB] TURSO_AUTH_TOKEN set: ${!!process.env.TURSO_AUTH_TOKEN}`);
console.log(`[DB] Mode: ${isProduction ? "Turso (remote)" : "SQLite (local)"}`);

export const db = createClient(
  isProduction
    ? {
        url: dbUrl!,
        authToken: process.env.TURSO_AUTH_TOKEN,
      }
    : {
        // Local SQLite file for development
        url: "file:local.db",
      }
);

console.log(`[DB] Client created successfully`);

