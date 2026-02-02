# HostAI Scan

Website diagnostic tool for short-term rental businesses. Analyzes conversion blockers, performance issues, SEO health, and trust signals.

## Features

- **Multi-source analysis** - PageSpeed Insights, SEMrush, DataForSEO
- **STR-specific scoring** - Weighted for vacation rental conversion factors
- **Real-time scanning** - Animated multi-phase scanner UI
- **Admin dashboard** - Deep dive into raw API data with formatted views

## Quick Start

```bash
pnpm install
cp .env.example .env.local  # Add your API keys
pnpm dev
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SEMRUSH_API_KEY` | Yes | SEMrush API key for SEO metrics |
| `DATAFORSEO_LOGIN` | Yes | DataForSEO account login |
| `DATAFORSEO_PASSWORD` | Yes | DataForSEO account password |
| `PAGESPEED_API_KEY` | No | Google PageSpeed API key (optional) |

### BigQuery Export (Optional)

| Variable | Required | Description |
|----------|----------|-------------|
| `BIGQUERY_PROJECT_ID` | For export | GCP project ID |
| `BIGQUERY_DATASET_ID` | For export | BigQuery dataset name |
| `GOOGLE_CREDENTIALS_JSON` | For export | Service account JSON (stringified) |

## BigQuery Export Setup

Export audit data to BigQuery for analytics and reporting.

### 1. Create a Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **IAM & Admin → Service Accounts**
3. Click **Create Service Account**
   - Name: `hostai-bigquery-export`
4. Grant roles: `BigQuery Data Editor` + `BigQuery Job User`
5. Create a JSON key and download it

### 2. Configure Credentials

**For Vercel/Heroku** (JSON string):
```bash
GOOGLE_CREDENTIALS_JSON={"type":"service_account","project_id":"...","private_key":"..."}
```

**For local development** (file path):
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"
```

### 3. Usage

```typescript
import { createBigQueryExporter } from "@/lib/export";

const exporter = createBigQueryExporter({
  projectId: process.env.BIGQUERY_PROJECT_ID!,
  datasetId: process.env.BIGQUERY_DATASET_ID!,
});

await exporter.exportAudit(auditResult);
```

### Tables Created

| Table | Description |
|-------|-------------|
| `audits` | Main audit data with all scores and metrics |
| `recommendations` | Individual recommendations per audit |
| `categories` | Category scores per audit |

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Farach%2Fhostai-scan&env=SEMRUSH_API_KEY,DATAFORSEO_LOGIN,DATAFORSEO_PASSWORD,PAGESPEED_API_KEY)

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Lucide Icons

## License

Private - HostAI
