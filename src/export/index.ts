/**
 * BigQuery export module
 *
 * Exports audit data to BigQuery with normalized tables for analytics.
 *
 * @example
 * ```typescript
 * import { createBigQueryExporter, transformAuditToBigQueryRows } from "@gethostai/audit-core/export";
 *
 * // Export a single audit
 * const exporter = createBigQueryExporter({
 *   projectId: "my-project",
 *   datasetId: "audits",
 * });
 *
 * const result = await exporter.exportAudit(audit);
 * console.log(`Inserted ${result.rowsInserted.findings} findings`);
 *
 * // Or just transform without exporting (for local testing)
 * const rows = transformAuditToBigQueryRows(audit);
 * console.log(JSON.stringify(rows.audit, null, 2));
 * ```
 */

export {
  BigQueryExporter,
  createBigQueryExporter,
  type BigQueryConfig,
  type ExportResult,
  type BatchExportResult,
} from "./bigquery-client.js";

export {
  transformAuditToBigQueryRows,
  type BigQueryRows,
  type AuditRow,
  type FindingRow,
  type CrawlPageRow,
  type BookingStepRow,
  type SessionReplayRow,
  type ModuleErrorRow,
  type LighthouseOpportunityRow,
} from "./bigquery-transform.js";

export {
  auditsSchema,
  findingsSchema,
  crawlPagesSchema,
  bookingStepsSchema,
  sessionReplaysSchema,
  moduleErrorsSchema,
  lighthouseOpportunitiesSchema,
  tableConfigs,
  ALL_TABLE_NAMES,
  type TableName,
} from "./bigquery-schema.js";
