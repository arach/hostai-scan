# GetHost.AI Website Diagnostic Tool

A GTM (go-to-market) audit tool for short-term rental (STR) websites. Produces evidence-based reports that identify conversion blockers, performance issues, and trust gaps.

## Quick Start

```bash
pnpm install
pnpm build
pnpm test
```

## BigQuery Export Setup

Export audit data to BigQuery for analytics and reporting.

### 1. Create a Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **IAM & Admin → Service Accounts**
3. Click **Create Service Account**
   - Name: `gethostai-bigquery-export`
   - Description: "Exports audit data to BigQuery"
4. Grant roles:
   - `BigQuery Data Editor`
   - `BigQuery Job User`
5. Click **Done**

### 2. Generate Credentials

1. Click on your new service account
2. Go to **Keys → Add Key → Create new key**
3. Select **JSON** format
4. Download the file (keep it secure!)

The JSON file looks like:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "gethostai-bigquery-export@your-project.iam.gserviceaccount.com",
  "client_id": "123456789012345678901",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

### 3. Configure Environment Variables

#### Option A: File Path (Local Development)
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
export BIGQUERY_PROJECT_ID="your-project-id"
export BIGQUERY_DATASET_ID="audit_exports"
```

#### Option B: JSON String (Vercel/Heroku/CI)

For platforms that don't support file uploads, stringify the entire JSON:

```bash
# In your deployment platform's environment settings:
GOOGLE_CREDENTIALS_JSON={"type":"service_account","project_id":"your-project-id","private_key_id":"abc123","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...@....iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/..."}
BIGQUERY_PROJECT_ID=your-project-id
BIGQUERY_DATASET_ID=audit_exports
```

**Important:** The JSON must be on a single line with no extra whitespace.

#### Option C: GCP Default Credentials

If running on Google Cloud (Cloud Run, GKE, etc.), no credentials needed - just ensure the service account has the required roles.

### 4. Usage

#### CLI Export
```bash
# Transform only (no BigQuery needed) - for testing
npx tsx src/examples/export-to-bigquery.ts --transform-only

# Export to BigQuery
npx tsx src/examples/export-to-bigquery.ts <project-id> <dataset-id> [audit.json]
```

#### Programmatic Export
```typescript
import { createBigQueryExporter } from "./export";

const exporter = createBigQueryExporter({
  projectId: process.env.BIGQUERY_PROJECT_ID,
  datasetId: process.env.BIGQUERY_DATASET_ID,
});

// Export single audit
await exporter.exportAudit(normalizedAudit);

// Batch export with streaming
await exporter.streamExport(audits);
```

### BigQuery Tables

The export creates these tables (auto-created if they don't exist):

| Table | Description | Partitioned By | Clustered By |
|-------|-------------|----------------|--------------|
| `audits` | Main audit data with scores | `generated_at` | `domain`, `status` |
| `findings` | Individual issues found | `inserted_at` | `audit_id`, `category`, `severity` |
| `crawl_pages` | Crawled page details | `inserted_at` | `audit_id`, `kind` |
| `booking_steps` | Booking path analysis | `inserted_at` | `audit_id` |
| `session_replays` | Browserbase replays | `inserted_at` | `audit_id`, `strategy` |
| `module_errors` | Per-module errors | `inserted_at` | `audit_id`, `module` |
| `lighthouse_opportunities` | Performance opportunities | `inserted_at` | `audit_id`, `strategy` |

### Troubleshooting

**"Could not load the default credentials"**
- Ensure `GOOGLE_APPLICATION_CREDENTIALS` points to a valid JSON file, OR
- Ensure `GOOGLE_CREDENTIALS_JSON` contains valid JSON (no line breaks)

**"Permission denied" or "Access Denied"**
- Verify the service account has `BigQuery Data Editor` and `BigQuery Job User` roles
- Check the project ID matches where the service account was created

**"Dataset not found"**
- The dataset is auto-created by default. If `autoCreateTables: false`, create it manually first.

## Documentation

- [SPEC.md](docs/SPEC.md) - Full specification
- [TYPES.md](docs/TYPES.md) - TypeScript type definitions
- [CLAUDE.md](CLAUDE.md) - Claude Code instructions
