# HostAI Scan

Website diagnostic tool for short-term rental (STR) businesses. Scores websites on conversion, performance, SEO, and trust signals.

## Getting Started

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

```bash
# Required - API Keys
SEMRUSH_API_KEY=           # SEMrush API for SEO metrics
DATAFORSEO_LOGIN=          # DataForSEO credentials
DATAFORSEO_PASSWORD=

# Optional
PAGESPEED_API_KEY=         # Google PageSpeed (works without, but rate-limited)
ADMIN_PASSWORD=            # Admin dashboard access (default: none)

# Database (auto-uses SQLite locally)
TURSO_DATABASE_URL=        # Turso/LibSQL for production
TURSO_AUTH_TOKEN=

# Analytics (optional)
NEXT_PUBLIC_GA_ID=         # Google Analytics 4
```

## Project Structure

```
src/
├── app/                   # Next.js App Router
│   ├── api/              # API routes
│   │   ├── audit/        # Scan endpoints
│   │   ├── analytics/    # Tracking endpoints
│   │   ├── batches/      # Bulk import
│   │   └── leads/        # Lead management
│   ├── admin/            # Admin dashboard
│   └── report/           # Public report pages
├── components/           # React components
├── lib/                  # Core logic
│   ├── audit-storage.ts  # Audit CRUD
│   ├── analytics.ts      # Event tracking
│   ├── batch-storage.ts  # Bulk operations
│   ├── lead-storage.ts   # Lead management
│   ├── link-storage.ts   # Shareable links + UTM
│   └── migrations/       # DB schema migrations
└── types/                # TypeScript definitions
```

## Key APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/audit/start` | POST | Start a new scan |
| `/api/audit/status/[jobId]` | GET | Poll scan progress |
| `/api/audit/[auditId]` | GET | Get completed audit |
| `/api/audits` | GET | List all audits |
| `/api/batches` | POST | Bulk import domains |
| `/api/leads` | GET/POST | Lead management |

## Running Scans

```bash
# Start a scan
curl -X POST http://localhost:3000/api/audit/start \
  -H "Content-Type: application/json" \
  -d '{"domain": "example.com"}'

# Response: { "jobId": "abc123", "status": "pending" }

# Poll for completion
curl http://localhost:3000/api/audit/status/abc123
```

## Admin Dashboard

Access at `/admin` (requires `ADMIN_PASSWORD` if set).

Features:
- View all scans with raw API data
- Bulk import via CSV
- Lead tracking and scoring
- Analytics overview

## Database

- **Local dev**: SQLite (auto-created at `local.db`)
- **Production**: Turso/LibSQL (set `TURSO_*` env vars)

Migrations run automatically on startup.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite / Turso
- **APIs**: PageSpeed Insights, SEMrush, DataForSEO

## Common Tasks

```bash
# Type check
pnpm tsc --noEmit

# Lint
pnpm lint

# Build for production
pnpm build
```

## License

Private - HostAI
