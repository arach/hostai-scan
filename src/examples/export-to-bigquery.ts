/**
 * Example: Export audit data to BigQuery
 *
 * This example demonstrates how to:
 * 1. Transform an audit to BigQuery rows (for inspection/testing)
 * 2. Export audits to BigQuery tables
 * 3. Batch export multiple audits
 *
 * Prerequisites:
 * - Google Cloud project with BigQuery enabled
 * - GOOGLE_APPLICATION_CREDENTIALS environment variable set
 * - Or run on GCP with default service account
 *
 * Usage:
 *   npx tsx src/examples/export-to-bigquery.ts <project-id> <dataset-id> [audit.json]
 */

import { createBigQueryExporter, transformAuditToBigQueryRows } from "../export/index.js";
import type { NormalizedAudit } from "../types/index.js";
import { readFileSync } from "fs";

// Sample audit for demonstration
const sampleAudit: NormalizedAudit = {
  auditId: "sample-audit-001",
  domain: "example-vacation-rental.com",
  status: "complete",
  generatedAt: new Date().toISOString(),
  inputs: {
    auditId: "sample-audit-001",
    domain: "example-vacation-rental.com",
    startedAt: new Date().toISOString(),
    campaign: {
      id: "camp-001",
      source: "direct",
    },
    pages: [
      { url: "https://example-vacation-rental.com/", kind: "home" },
      { url: "https://example-vacation-rental.com/properties/beach-house", kind: "property" },
    ],
  },
  perf: {
    byStrategy: {
      mobile: {
        fetchedAt: new Date().toISOString(),
        url: "https://example-vacation-rental.com/",
        categoryScore: {
          performance: 45,
          accessibility: 82,
          bestPractices: 78,
          seo: 90,
        },
        metrics: {
          lcpMs: 4200,
          cls: 0.15,
          inpMs: 350,
          fcpMs: 1800,
          tbtMs: 800,
          speedIndexMs: 3200,
        },
        opportunities: [
          {
            id: "render-blocking-resources",
            title: "Eliminate render-blocking resources",
            estimatedSavingsMs: 1200,
          },
          {
            id: "unminified-javascript",
            title: "Minify JavaScript",
            estimatedSavingsMs: 450,
          },
        ],
      },
      desktop: {
        fetchedAt: new Date().toISOString(),
        url: "https://example-vacation-rental.com/",
        categoryScore: {
          performance: 72,
          accessibility: 85,
          bestPractices: 78,
          seo: 92,
        },
        metrics: {
          lcpMs: 2100,
          cls: 0.08,
          inpMs: 150,
          fcpMs: 900,
          tbtMs: 200,
          speedIndexMs: 1600,
        },
        opportunities: [
          {
            id: "render-blocking-resources",
            title: "Eliminate render-blocking resources",
            estimatedSavingsMs: 600,
          },
        ],
      },
    },
  },
  seo: {
    indexability: {
      robotsTxtPresent: true,
      sitemapPresent: false,
      hasNoindexOnMoneyPages: false,
    },
    meta: {
      missingTitlesCount: 2,
      duplicateTitlesCount: 0,
      missingDescriptionsCount: 5,
    },
    schema: {
      hasLocalBusiness: false,
      hasLodgingBusiness: false,
      hasFAQ: false,
      hasReview: false,
    },
  },
  tech: {
    cms: "WordPress",
    frameworks: ["jQuery"],
    cdn: "Cloudflare",
    analytics: {
      hasGA4: true,
      hasGTM: true,
      hasMetaPixel: false,
      hasGoogleAdsTag: false,
    },
    bookingEngine: {
      provider: "Lodgify",
      embedded: true,
      separateDomain: false,
    },
  },
  trust: {
    businessIdentity: {
      hasCompanyName: true,
      hasPhone: true,
      hasAddress: false,
    },
    reviews: {
      onSite: { present: true, countHint: 23 },
      google: { present: true, rating: 4.6, count: 45 },
    },
  },
  security: {
    tls: {
      hasHttps: true,
      mixedContent: false,
      sslLabsGrade: "A",
    },
    headers: {
      hsts: true,
      csp: false,
    },
  },
  scoring: {
    overallScore: 58,
    projectedScore: 78,
    projectedScoreWithProduct: 89,
    estimatedImpact: {
      conversionLossPercent: 35,
      topContributors: ["slow_mobile_lcp", "missing_sitemap", "no_schema"],
    },
    categoryScores: {
      conversion: {
        category: "conversion",
        score: 65,
        blockerCount: 0,
        findings: [],
      },
      performance: {
        category: "performance",
        score: 45,
        blockerCount: 1,
        findings: [
          {
            id: "performance.slow_lcp_mobile",
            title: "Slow Largest Contentful Paint on mobile",
            category: "performance",
            severity: "blocker",
            impact: 0.9,
            confidence: 1.0,
            penalty: 31,
            evidence: ["Mobile LCP is 4200ms (threshold: 2500ms)"],
            fix: "Optimize images, reduce render-blocking resources, implement lazy loading",
            effort: "medium",
            tags: ["core-web-vitals", "mobile"],
          },
        ],
      },
      trust: {
        category: "trust",
        score: 72,
        blockerCount: 0,
        findings: [],
      },
      seo: {
        category: "seo",
        score: 55,
        blockerCount: 0,
        findings: [
          {
            id: "seo.missing_sitemap",
            title: "Missing XML sitemap",
            category: "seo",
            severity: "major",
            impact: 0.7,
            confidence: 1.0,
            penalty: 12,
            evidence: ["No sitemap.xml found at /sitemap.xml"],
            fix: "Create and submit an XML sitemap to search engines",
            effort: "low",
            tags: ["indexability"],
          },
          {
            id: "seo.missing_schema",
            title: "Missing LodgingBusiness schema",
            category: "seo",
            severity: "major",
            impact: 0.6,
            confidence: 1.0,
            penalty: 10,
            evidence: ["No LodgingBusiness or LocalBusiness schema detected"],
            fix: "Add structured data markup for vacation rental business",
            effort: "medium",
            tags: ["schema", "rich-results"],
          },
        ],
      },
      security: {
        category: "security",
        score: 85,
        blockerCount: 0,
        findings: [],
      },
      content: {
        category: "content",
        score: 70,
        blockerCount: 0,
        findings: [],
      },
    },
    topIssues: [
      {
        id: "performance.slow_lcp_mobile",
        title: "Slow Largest Contentful Paint on mobile",
        category: "performance",
        severity: "blocker",
        impact: 0.9,
        confidence: 1.0,
        penalty: 31,
        evidence: ["Mobile LCP is 4200ms (threshold: 2500ms)"],
        fix: "Optimize images, reduce render-blocking resources, implement lazy loading",
        effort: "medium",
        tags: ["core-web-vitals", "mobile"],
      },
      {
        id: "seo.missing_sitemap",
        title: "Missing XML sitemap",
        category: "seo",
        severity: "major",
        impact: 0.7,
        confidence: 1.0,
        penalty: 12,
        evidence: ["No sitemap.xml found at /sitemap.xml"],
        fix: "Create and submit an XML sitemap to search engines",
        effort: "low",
        tags: ["indexability"],
      },
    ],
    fastWins: [
      {
        id: "seo.missing_sitemap",
        title: "Missing XML sitemap",
        category: "seo",
        severity: "major",
        impact: 0.7,
        confidence: 1.0,
        penalty: 12,
        evidence: ["No sitemap.xml found at /sitemap.xml"],
        fix: "Create and submit an XML sitemap to search engines",
        effort: "low",
        tags: ["indexability"],
      },
    ],
    generatedAt: new Date().toISOString(),
    version: "1.0.0",
  },
};

async function main() {
  const args = process.argv.slice(2);

  // Mode 1: Just transform and print (no BigQuery required)
  if (args.length === 0 || args[0] === "--transform-only") {
    console.log("Transforming sample audit to BigQuery rows...\n");

    const rows = transformAuditToBigQueryRows(sampleAudit);

    console.log("=== AUDIT ROW ===");
    console.log(JSON.stringify(rows.audit, null, 2));

    console.log("\n=== FINDINGS ===");
    console.log(JSON.stringify(rows.findings, null, 2));

    console.log("\n=== LIGHTHOUSE OPPORTUNITIES ===");
    console.log(JSON.stringify(rows.lighthouseOpportunities, null, 2));

    console.log("\n=== SUMMARY ===");
    console.log(`- 1 audit row`);
    console.log(`- ${rows.findings.length} finding rows`);
    console.log(`- ${rows.crawlPages.length} crawl page rows`);
    console.log(`- ${rows.bookingSteps.length} booking step rows`);
    console.log(`- ${rows.sessionReplays.length} session replay rows`);
    console.log(`- ${rows.moduleErrors.length} module error rows`);
    console.log(`- ${rows.lighthouseOpportunities.length} lighthouse opportunity rows`);

    return;
  }

  // Mode 2: Export to BigQuery
  if (args.length < 2) {
    console.error("Usage:");
    console.error("  Transform only: npx tsx src/examples/export-to-bigquery.ts");
    console.error(
      "  Export to BQ:   npx tsx src/examples/export-to-bigquery.ts <project-id> <dataset-id> [audit.json]"
    );
    process.exit(1);
  }

  const [projectId, datasetId, auditFile] = args;

  // Load audit from file if provided
  let audit: NormalizedAudit = sampleAudit;
  if (auditFile) {
    console.log(`Loading audit from ${auditFile}...`);
    const content = readFileSync(auditFile, "utf-8");
    audit = JSON.parse(content) as NormalizedAudit;
  }

  console.log(`Exporting audit ${audit.auditId} to BigQuery...`);
  console.log(`  Project: ${projectId}`);
  console.log(`  Dataset: ${datasetId}`);
  console.log(`  Domain: ${audit.domain}`);
  console.log("");

  const exporter = createBigQueryExporter({
    projectId,
    datasetId,
    autoCreateTables: true,
  });

  try {
    const result = await exporter.exportAudit(audit);

    if (result.success) {
      console.log("Export successful!");
      console.log("Rows inserted:");
      console.log(`  - audits: ${result.rowsInserted.audits}`);
      console.log(`  - findings: ${result.rowsInserted.findings}`);
      console.log(`  - crawl_pages: ${result.rowsInserted.crawl_pages}`);
      console.log(`  - booking_steps: ${result.rowsInserted.booking_steps}`);
      console.log(`  - session_replays: ${result.rowsInserted.session_replays}`);
      console.log(`  - module_errors: ${result.rowsInserted.module_errors}`);
      console.log(`  - lighthouse_opportunities: ${result.rowsInserted.lighthouse_opportunities}`);
    } else {
      console.error("Export failed:");
      console.error(result.errors?.join("\n"));
      process.exit(1);
    }
  } catch (error) {
    console.error("Error exporting to BigQuery:", error);
    process.exit(1);
  }
}

main().catch(console.error);
