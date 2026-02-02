/**
 * BigQuery client for exporting audit data
 *
 * Handles table creation, schema management, and data insertion.
 * Supports multiple credential methods for flexible deployment.
 */

import { BigQuery, Dataset, Table } from "@google-cloud/bigquery";
import type { AuditResult } from "@/types/audit";
import { transformAuditToBigQueryRows, type BigQueryRows } from "./bigquery-transform";
import { tableConfigs, ALL_TABLE_NAMES, type TableName } from "./bigquery-schema";

export interface BigQueryConfig {
  projectId: string;
  datasetId: string;
  /** Optional table prefix (e.g., "audit_" -> "audit_audits") */
  tablePrefix?: string;
  /** Location for dataset creation (default: "US") */
  location?: string;
  /** Create tables if they don't exist (default: true) */
  autoCreateTables?: boolean;
  /**
   * Optional credentials object. If not provided, will check:
   * 1. GOOGLE_CREDENTIALS_JSON env var (JSON string)
   * 2. GOOGLE_APPLICATION_CREDENTIALS env var (file path)
   * 3. Default GCP credentials
   */
  credentials?: Record<string, unknown>;
}

export interface ExportResult {
  success: boolean;
  auditId: string;
  rowsInserted: Record<TableName, number>;
  errors?: string[];
}

export interface BatchExportResult {
  total: number;
  successful: number;
  failed: number;
  results: ExportResult[];
}

/**
 * BigQuery export client for audit data
 */
export class BigQueryExporter {
  private bq: BigQuery;
  private config: Required<Omit<BigQueryConfig, "credentials">>;
  private dataset: Dataset | null = null;
  private tables: Map<TableName, Table> = new Map();
  private initialized = false;

  constructor(config: BigQueryConfig) {
    this.config = {
      projectId: config.projectId,
      datasetId: config.datasetId,
      tablePrefix: config.tablePrefix ?? "",
      location: config.location ?? "US",
      autoCreateTables: config.autoCreateTables ?? true,
    };

    // Resolve credentials in priority order:
    // 1. Explicit credentials passed in config
    // 2. GOOGLE_CREDENTIALS_JSON env var (JSON string - for Vercel/Heroku)
    // 3. GOOGLE_APPLICATION_CREDENTIALS env var (file path - handled by SDK)
    // 4. Default GCP credentials (when running on GCP)
    const credentials = config.credentials ?? this.resolveCredentialsFromEnv();

    this.bq = new BigQuery({
      projectId: this.config.projectId,
      ...(credentials && { credentials }),
    });
  }

  /**
   * Resolve credentials from GOOGLE_CREDENTIALS_JSON env var
   */
  private resolveCredentialsFromEnv(): Record<string, unknown> | undefined {
    const jsonCredentials = process.env.GOOGLE_CREDENTIALS_JSON;
    if (!jsonCredentials) {
      return undefined;
    }

    try {
      return JSON.parse(jsonCredentials);
    } catch (error) {
      throw new Error(
        `Failed to parse GOOGLE_CREDENTIALS_JSON: ${error instanceof Error ? error.message : "Invalid JSON"}`
      );
    }
  }

  /**
   * Initialize the exporter - creates dataset and tables if needed
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Get or create dataset
    this.dataset = this.bq.dataset(this.config.datasetId);
    const [datasetExists] = await this.dataset.exists();

    if (!datasetExists) {
      if (!this.config.autoCreateTables) {
        throw new Error(`Dataset ${this.config.datasetId} does not exist`);
      }
      await this.bq.createDataset(this.config.datasetId, {
        location: this.config.location,
      });
      this.dataset = this.bq.dataset(this.config.datasetId);
    }

    // Get or create tables
    if (this.config.autoCreateTables) {
      await this.ensureTablesExist();
    }

    // Cache table references
    for (const tableName of ALL_TABLE_NAMES) {
      const fullName = this.getFullTableName(tableName);
      this.tables.set(tableName, this.dataset.table(fullName));
    }

    this.initialized = true;
  }

  /**
   * Export a single audit to BigQuery
   */
  async exportAudit(audit: AuditResult): Promise<ExportResult> {
    await this.initialize();

    const auditId = audit.auditId || `${audit.domain}-${Date.now()}`;

    const result: ExportResult = {
      success: true,
      auditId,
      rowsInserted: {
        audits: 0,
        recommendations: 0,
        categories: 0,
      },
      errors: [],
    };

    try {
      const rows = transformAuditToBigQueryRows(audit);
      await this.insertRows(rows, result);
    } catch (error) {
      result.success = false;
      result.errors?.push(error instanceof Error ? error.message : String(error));
    }

    return result;
  }

  /**
   * Export multiple audits in batch
   */
  async exportBatch(audits: AuditResult[]): Promise<BatchExportResult> {
    await this.initialize();

    const results: ExportResult[] = [];
    let successful = 0;
    let failed = 0;

    for (const audit of audits) {
      const result = await this.exportAudit(audit);
      results.push(result);
      if (result.success) {
        successful++;
      } else {
        failed++;
      }
    }

    return {
      total: audits.length,
      successful,
      failed,
      results,
    };
  }

  /**
   * Get the full table name with optional prefix
   */
  getFullTableName(tableName: TableName): string {
    return `${this.config.tablePrefix}${tableName}`;
  }

  /**
   * Delete all data for a specific audit (useful for re-processing)
   */
  async deleteAudit(auditId: string): Promise<void> {
    await this.initialize();

    const deletePromises = ALL_TABLE_NAMES.map(async (tableName) => {
      const fullName = this.getFullTableName(tableName);
      const query = `DELETE FROM \`${this.config.projectId}.${this.config.datasetId}.${fullName}\` WHERE audit_id = @auditId`;
      await this.bq.query({
        query,
        params: { auditId },
      });
    });

    await Promise.all(deletePromises);
  }

  /**
   * Ensure all tables exist with correct schemas
   */
  private async ensureTablesExist(): Promise<void> {
    if (!this.dataset) {
      throw new Error("Dataset not initialized");
    }

    for (const tableName of ALL_TABLE_NAMES) {
      const fullName = this.getFullTableName(tableName);
      const table = this.dataset.table(fullName);
      const [exists] = await table.exists();

      if (!exists) {
        const config = tableConfigs[tableName];
        await this.dataset.createTable(fullName, {
          schema: config.schema,
          timePartitioning: config.timePartitioning,
          clustering: config.clustering,
        });
      }
    }
  }

  /**
   * Insert rows into all tables for a single audit
   */
  private async insertRows(rows: BigQueryRows, result: ExportResult): Promise<void> {
    // Insert main audit row
    if (rows.audit) {
      await this.insertToTable("audits", [rows.audit]);
      result.rowsInserted.audits = 1;
    }

    // Insert child rows in parallel
    const insertPromises: Promise<void>[] = [];

    if (rows.recommendations.length > 0) {
      insertPromises.push(
        this.insertToTable("recommendations", rows.recommendations).then(() => {
          result.rowsInserted.recommendations = rows.recommendations.length;
        })
      );
    }

    if (rows.categories.length > 0) {
      insertPromises.push(
        this.insertToTable("categories", rows.categories).then(() => {
          result.rowsInserted.categories = rows.categories.length;
        })
      );
    }

    await Promise.all(insertPromises);
  }

  /**
   * Insert rows into a specific table
   */
  private async insertToTable(tableName: TableName, rows: unknown[]): Promise<void> {
    if (rows.length === 0) return;

    const table = this.tables.get(tableName);
    if (!table) {
      throw new Error(`Table ${tableName} not initialized`);
    }

    await table.insert(rows);
  }
}

/**
 * Create a BigQuery exporter instance
 */
export function createBigQueryExporter(config: BigQueryConfig): BigQueryExporter {
  return new BigQueryExporter(config);
}
