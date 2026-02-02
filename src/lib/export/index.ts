export { BigQueryExporter, createBigQueryExporter } from "./bigquery-client";
export type { BigQueryConfig, ExportResult, BatchExportResult } from "./bigquery-client";

export { transformAuditToBigQueryRows } from "./bigquery-transform";
export type {
  AuditRow,
  RecommendationRow,
  CategoryRow,
  BigQueryRows,
} from "./bigquery-transform";

export {
  auditsSchema,
  recommendationsSchema,
  categoriesSchema,
  tableConfigs,
  ALL_TABLE_NAMES,
} from "./bigquery-schema";
export type { TableName } from "./bigquery-schema";
