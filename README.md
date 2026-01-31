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

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Farach%2Fhostai-scan&env=SEMRUSH_API_KEY,DATAFORSEO_LOGIN,DATAFORSEO_PASSWORD,PAGESPEED_API_KEY)

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Lucide Icons

## License

Private - HostAI
