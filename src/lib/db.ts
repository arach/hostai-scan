import { createClient } from "@libsql/client";

// Use local SQLite file for development, Turso for production
const isProduction = process.env.TURSO_DATABASE_URL?.startsWith("libsql://");

export const db = createClient(
  isProduction
    ? {
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN,
      }
    : {
        // Local SQLite file for development
        url: "file:local.db",
      }
);

console.log(`Database: ${isProduction ? "Turso (remote)" : "SQLite (local)"}`);

