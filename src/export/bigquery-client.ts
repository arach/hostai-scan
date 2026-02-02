/**
 * BigQuery client for exporting audit data
 *
 * Handles table creation, schema management, and data insertion.
 */

import { BigQuery, Dataset, Table } from "@google-cloud/bigquery";
import type { NormalizedAudit } from "../types/index.js";
import { transformAuditToBigQueryRows, type BigQueryRows } from "./bigquery-transform.js";
import { tableConfigs, ALL_TABLE_NAMES, type TableName } from "./bigquery-schema.js";

export interface BigQueryConfig {
  projectId: string;
  datasetId: string;
  /** Optional table prefix (e.g., "audit_" -> "audit_findings") */
  tablePrefix?: string;
  /** Location for dataset creation (default: "US") */
  location?: string;
  /** Create tables if they don't exist (default: true) */
  autoCreateTables?: boolean;
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
  private config: Required<BigQueryConfig>;
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

    this.bq = new BigQuery({
      projectId: this.config.projectId,
    });
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
  async exportAudit(audit: NormalizedAudit): Promise<ExportResult> {
    await this.initialize();

    const result: ExportResult = {
      success: true,
      auditId: audit.auditId,
      rowsInserted: {
        audits: 0,
        findings: 0,
        crawl_pages: 0,
        booking_steps: 0,
        session_replays: 0,
        module_errors: 0,
        lighthouse_opportunities: 0,
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
  async exportBatch(audits: NormalizedAudit[]): Promise<BatchExportResult> {
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
   * Export audits using streaming inserts for better performance
   */
  async streamExport(audits: NormalizedAudit[]): Promise<BatchExportResult> {
    await this.initialize();

    // Transform all audits first
    const allRows: BigQueryRows[] = audits.map((audit) => transformAuditToBigQueryRows(audit));

    const result: BatchExportResult = {
      total: audits.length,
      successful: 0,
      failed: 0,
      results: [],
    };

    // Batch rows by table for efficient streaming
    const batches = {
      audits: allRows.map((r) => r.audit),
      findings: allRows.flatMap((r) => r.findings),
      crawl_pages: allRows.flatMap((r) => r.crawlPages),
      booking_steps: allRows.flatMap((r) => r.bookingSteps),
      session_replays: allRows.flatMap((r) => r.sessionReplays),
      module_errors: allRows.flatMap((r) => r.moduleErrors),
      lighthouse_opportunities: allRows.flatMap((r) => r.lighthouseOpportunities),
    };

    try {
      // Insert all tables in parallel
      await Promise.all([
        this.streamInsertTable("audits", batches.audits),
        this.streamInsertTable("findings", batches.findings),
        this.streamInsertTable("crawl_pages", batches.crawl_pages),
        this.streamInsertTable("booking_steps", batches.booking_steps),
        this.streamInsertTable("session_replays", batches.session_replays),
        this.streamInsertTable("module_errors", batches.module_errors),
        this.streamInsertTable("lighthouse_opportunities", batches.lighthouse_opportunities),
      ]);

      result.successful = audits.length;

      // Create per-audit results
      for (let i = 0; i < audits.length; i++) {
        const rows = allRows[i];
        result.results.push({
          success: true,
          auditId: audits[i].auditId,
          rowsInserted: {
            audits: 1,
            findings: rows.findings.length,
            crawl_pages: rows.crawlPages.length,
            booking_steps: rows.bookingSteps.length,
            session_replays: rows.sessionReplays.length,
            module_errors: rows.moduleErrors.length,
            lighthouse_opportunities: rows.lighthouseOpportunities.length,
          },
        });
      }
    } catch (error) {
      result.failed = audits.length;
      const errorMsg = error instanceof Error ? error.message : String(error);
      for (const audit of audits) {
        result.results.push({
          success: false,
          auditId: audit.auditId,
          rowsInserted: {
            audits: 0,
            findings: 0,
            crawl_pages: 0,
            booking_steps: 0,
            session_replays: 0,
            module_errors: 0,
            lighthouse_opportunities: 0,
          },
          errors: [errorMsg],
        });
      }
    }

    return result;
  }

  /**
   * Get the full table name with optional prefix
   */
  getFullTableName(tableName: TableName): string {
    return `${this.config.tablePrefix}${tableName}`;
  }

  /**
   * Get SQL for creating all tables (useful for manual setup)
   */
  getCreateTableSQL(): string {
    const statements: string[] = [];

    for (const tableName of ALL_TABLE_NAMES) {
      const config = tableConfigs[tableName];
      const fullName = this.getFullTableName(tableName);
      const fullTableRef = `\`${this.config.projectId}.${this.config.datasetId}.${fullName}\``;

      const fields = config.schema?.fields?.map((f) => {
        const mode = f.mode === "REPEATED" ? "ARRAY" : "";
        const nullable = f.mode === "NULLABLE" ? "" : "NOT NULL";
        if (mode === "ARRAY") {
          return `  ${f.name} ARRAY<${f.type}>`;
        }
        return `  ${f.name} ${f.type} ${nullable}`.trim();
      });

      let sql = `CREATE TABLE IF NOT EXISTS ${fullTableRef} (\n${fields?.join(",\n")}\n)`;

      if (config.timePartitioning) {
        sql += `\nPARTITION BY DATE(${config.timePartitioning.field})`;
      }

      if (config.clustering?.fields) {
        sql += `\nCLUSTER BY ${config.clustering.fields.join(", ")}`;
      }

      statements.push(sql + ";");
    }

    return statements.join("\n\n");
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

    if (rows.findings.length > 0) {
      insertPromises.push(
        this.insertToTable("findings", rows.findings).then(() => {
          result.rowsInserted.findings = rows.findings.length;
        })
      );
    }

    if (rows.crawlPages.length > 0) {
      insertPromises.push(
        this.insertToTable("crawl_pages", rows.crawlPages).then(() => {
          result.rowsInserted.crawl_pages = rows.crawlPages.length;
        })
      );
    }

    if (rows.bookingSteps.length > 0) {
      insertPromises.push(
        this.insertToTable("booking_steps", rows.bookingSteps).then(() => {
          result.rowsInserted.booking_steps = rows.bookingSteps.length;
        })
      );
    }

    if (rows.sessionReplays.length > 0) {
      insertPromises.push(
        this.insertToTable("session_replays", rows.sessionReplays).then(() => {
          result.rowsInserted.session_replays = rows.sessionReplays.length;
        })
      );
    }

    if (rows.moduleErrors.length > 0) {
      insertPromises.push(
        this.insertToTable("module_errors", rows.moduleErrors).then(() => {
          result.rowsInserted.module_errors = rows.moduleErrors.length;
        })
      );
    }

    if (rows.lighthouseOpportunities.length > 0) {
      insertPromises.push(
        this.insertToTable("lighthouse_opportunities", rows.lighthouseOpportunities).then(() => {
          result.rowsInserted.lighthouse_opportunities = rows.lighthouseOpportunities.length;
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

  /**
   * Stream insert rows into a specific table
   */
  private async streamInsertTable(tableName: TableName, rows: unknown[]): Promise<void> {
    if (rows.length === 0) return;

    const table = this.tables.get(tableName);
    if (!table) {
      throw new Error(`Table ${tableName} not initialized`);
    }

    // BigQuery streaming has a limit of 10,000 rows per request
    const BATCH_SIZE = 10000;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      await table.insert(batch);
    }
  }
}

/**
 * Create a BigQuery exporter instance
 */
export function createBigQueryExporter(config: BigQueryConfig): BigQueryExporter {
  return new BigQueryExporter(config);
}
