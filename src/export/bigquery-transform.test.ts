import { describe, it, expect } from "vitest";
import { transformAuditToBigQueryRows } from "./bigquery-transform.js";
import type { NormalizedAudit, Finding } from "../types/index.js";

// Minimal audit fixture
const createMinimalAudit = (overrides: Partial<NormalizedAudit> = {}): NormalizedAudit => ({
  auditId: "test-audit-001",
  domain: "test.com",
  status: "complete",
  generatedAt: "2024-01-15T10:00:00Z",
  inputs: {
    auditId: "test-audit-001",
    domain: "test.com",
    startedAt: "2024-01-15T09:55:00Z",
    pages: [{ url: "https://test.com/", kind: "home" }],
  },
  ...overrides,
});

const createFinding = (overrides: Partial<Finding> = {}): Finding => ({
  id: "test.finding",
  title: "Test Finding",
  category: "performance",
  severity: "major",
  impact: 0.8,
  confidence: 1.0,
  penalty: 14,
  evidence: ["Test evidence"],
  fix: "Fix this",
  effort: "low",
  tags: ["test"],
  ...overrides,
});

describe("transformAuditToBigQueryRows", () => {
  describe("audit row", () => {
    it("transforms minimal audit correctly", () => {
      const audit = createMinimalAudit();
      const rows = transformAuditToBigQueryRows(audit);

      expect(rows.audit.audit_id).toBe("test-audit-001");
      expect(rows.audit.domain).toBe("test.com");
      expect(rows.audit.status).toBe("complete");
      expect(rows.audit.generated_at).toBe("2024-01-15T10:00:00Z");
      expect(rows.audit.started_at).toBe("2024-01-15T09:55:00Z");
      expect(rows.audit.inserted_at).toBeDefined();
    });

    it("transforms campaign metadata", () => {
      const audit = createMinimalAudit({
        inputs: {
          auditId: "test-audit-001",
          domain: "test.com",
          startedAt: "2024-01-15T09:55:00Z",
          campaign: {
            id: "camp-123",
            source: "email",
            initiatorId: "user-456",
          },
          pages: [],
        },
      });
      const rows = transformAuditToBigQueryRows(audit);

      expect(rows.audit.campaign_id).toBe("camp-123");
      expect(rows.audit.campaign_source).toBe("email");
      expect(rows.audit.initiator_id).toBe("user-456");
    });

    it("transforms performance metrics", () => {
      const audit = createMinimalAudit({
        perf: {
          byStrategy: {
            mobile: {
              fetchedAt: "2024-01-15T10:00:00Z",
              url: "https://test.com/",
              categoryScore: {
                performance: 45,
                accessibility: 82,
              },
              metrics: {
                lcpMs: 4200,
                cls: 0.15,
                inpMs: 350,
              },
              opportunities: [],
            },
            desktop: {
              fetchedAt: "2024-01-15T10:00:00Z",
              url: "https://test.com/",
              categoryScore: {
                performance: 72,
              },
              metrics: {
                lcpMs: 2100,
                cls: 0.08,
              },
              opportunities: [],
            },
          },
        },
      });
      const rows = transformAuditToBigQueryRows(audit);

      expect(rows.audit.mobile_lcp_ms).toBe(4200);
      expect(rows.audit.mobile_cls).toBe(0.15);
      expect(rows.audit.mobile_inp_ms).toBe(350);
      expect(rows.audit.mobile_performance_score).toBe(45);
      expect(rows.audit.mobile_accessibility_score).toBe(82);

      expect(rows.audit.desktop_lcp_ms).toBe(2100);
      expect(rows.audit.desktop_cls).toBe(0.08);
      expect(rows.audit.desktop_performance_score).toBe(72);
    });

    it("transforms SEO signals", () => {
      const audit = createMinimalAudit({
        seo: {
          indexability: {
            robotsTxtPresent: true,
            sitemapPresent: false,
            hasNoindexOnMoneyPages: true,
          },
          meta: {
            missingTitlesCount: 3,
            duplicateTitlesCount: 1,
            missingDescriptionsCount: 5,
          },
          schema: {
            hasLocalBusiness: true,
            hasLodgingBusiness: false,
            hasFAQ: true,
            hasReview: false,
          },
        },
      });
      const rows = transformAuditToBigQueryRows(audit);

      expect(rows.audit.robots_txt_present).toBe(true);
      expect(rows.audit.sitemap_present).toBe(false);
      expect(rows.audit.has_noindex_on_money_pages).toBe(true);
      expect(rows.audit.missing_titles_count).toBe(3);
      expect(rows.audit.duplicate_titles_count).toBe(1);
      expect(rows.audit.missing_descriptions_count).toBe(5);
      expect(rows.audit.has_local_business_schema).toBe(true);
      expect(rows.audit.has_lodging_business_schema).toBe(false);
      expect(rows.audit.has_faq_schema).toBe(true);
      expect(rows.audit.has_review_schema).toBe(false);
    });

    it("transforms tech signals", () => {
      const audit = createMinimalAudit({
        tech: {
          cms: "WordPress",
          frameworks: ["React", "Next.js"],
          cdn: "Cloudflare",
          analytics: {
            hasGA4: true,
            hasGTM: true,
            hasMetaPixel: false,
            hasGoogleAdsTag: true,
          },
          bookingEngine: {
            provider: "Lodgify",
            embedded: true,
            separateDomain: false,
          },
          chatWidget: "Intercom",
        },
      });
      const rows = transformAuditToBigQueryRows(audit);

      expect(rows.audit.cms).toBe("WordPress");
      expect(rows.audit.frameworks).toEqual(["React", "Next.js"]);
      expect(rows.audit.cdn).toBe("Cloudflare");
      expect(rows.audit.has_ga4).toBe(true);
      expect(rows.audit.has_gtm).toBe(true);
      expect(rows.audit.has_meta_pixel).toBe(false);
      expect(rows.audit.has_google_ads_tag).toBe(true);
      expect(rows.audit.booking_engine_provider).toBe("Lodgify");
      expect(rows.audit.booking_engine_embedded).toBe(true);
      expect(rows.audit.booking_engine_separate_domain).toBe(false);
      expect(rows.audit.chat_widget).toBe("Intercom");
    });

    it("transforms scoring summary", () => {
      const finding = createFinding();
      const audit = createMinimalAudit({
        scoring: {
          overallScore: 58,
          projectedScore: 78,
          projectedScoreWithProduct: 89,
          estimatedImpact: {
            conversionLossPercent: 35,
            topContributors: ["slow_lcp", "missing_sitemap"],
          },
          categoryScores: {
            conversion: { category: "conversion", score: 65, blockerCount: 0, findings: [] },
            performance: { category: "performance", score: 45, blockerCount: 1, findings: [finding] },
            trust: { category: "trust", score: 72, blockerCount: 0, findings: [] },
            seo: { category: "seo", score: 55, blockerCount: 0, findings: [] },
            security: { category: "security", score: 85, blockerCount: 0, findings: [] },
            content: { category: "content", score: 70, blockerCount: 0, findings: [] },
          },
          topIssues: [finding],
          fastWins: [],
          generatedAt: "2024-01-15T10:00:00Z",
          version: "1.0.0",
        },
      });
      const rows = transformAuditToBigQueryRows(audit);

      expect(rows.audit.overall_score).toBe(58);
      expect(rows.audit.projected_score).toBe(78);
      expect(rows.audit.projected_score_with_product).toBe(89);
      expect(rows.audit.conversion_loss_percent).toBe(35);
      expect(rows.audit.conversion_score).toBe(65);
      expect(rows.audit.performance_score).toBe(45);
      expect(rows.audit.performance_blocker_count).toBe(1);
      expect(rows.audit.top_contributors).toEqual(["slow_lcp", "missing_sitemap"]);
      expect(rows.audit.scoring_version).toBe("1.0.0");
    });
  });

  describe("findings rows", () => {
    it("extracts findings from category scores", () => {
      const finding1 = createFinding({ id: "perf.lcp", category: "performance" });
      const finding2 = createFinding({ id: "seo.sitemap", category: "seo" });

      const audit = createMinimalAudit({
        scoring: {
          overallScore: 58,
          projectedScore: 78,
          projectedScoreWithProduct: 89,
          estimatedImpact: { conversionLossPercent: 35, topContributors: [] },
          categoryScores: {
            conversion: { category: "conversion", score: 65, blockerCount: 0, findings: [] },
            performance: { category: "performance", score: 45, blockerCount: 1, findings: [finding1] },
            trust: { category: "trust", score: 72, blockerCount: 0, findings: [] },
            seo: { category: "seo", score: 55, blockerCount: 0, findings: [finding2] },
            security: { category: "security", score: 85, blockerCount: 0, findings: [] },
            content: { category: "content", score: 70, blockerCount: 0, findings: [] },
          },
          topIssues: [finding1],
          fastWins: [finding2],
          generatedAt: "2024-01-15T10:00:00Z",
          version: "1.0.0",
        },
      });

      const rows = transformAuditToBigQueryRows(audit);

      expect(rows.findings).toHaveLength(2);

      const perfFinding = rows.findings.find((f) => f.finding_id === "perf.lcp");
      expect(perfFinding).toBeDefined();
      expect(perfFinding?.is_top_issue).toBe(true);
      expect(perfFinding?.is_fast_win).toBe(false);
      expect(perfFinding?.ranking).toBe(1);

      const seoFinding = rows.findings.find((f) => f.finding_id === "seo.sitemap");
      expect(seoFinding).toBeDefined();
      expect(seoFinding?.is_top_issue).toBe(false);
      expect(seoFinding?.is_fast_win).toBe(true);
      expect(seoFinding?.ranking).toBe(1);
    });

    it("deduplicates findings across categories and top/fast lists", () => {
      const finding = createFinding({ id: "shared.finding" });

      const audit = createMinimalAudit({
        scoring: {
          overallScore: 58,
          projectedScore: 78,
          projectedScoreWithProduct: 89,
          estimatedImpact: { conversionLossPercent: 35, topContributors: [] },
          categoryScores: {
            conversion: { category: "conversion", score: 65, blockerCount: 0, findings: [] },
            performance: { category: "performance", score: 45, blockerCount: 1, findings: [finding] },
            trust: { category: "trust", score: 72, blockerCount: 0, findings: [] },
            seo: { category: "seo", score: 55, blockerCount: 0, findings: [] },
            security: { category: "security", score: 85, blockerCount: 0, findings: [] },
            content: { category: "content", score: 70, blockerCount: 0, findings: [] },
          },
          topIssues: [finding],
          fastWins: [finding],
          generatedAt: "2024-01-15T10:00:00Z",
          version: "1.0.0",
        },
      });

      const rows = transformAuditToBigQueryRows(audit);

      // Should only have one row despite appearing in category, topIssues, and fastWins
      expect(rows.findings).toHaveLength(1);
      expect(rows.findings[0].is_top_issue).toBe(true);
      expect(rows.findings[0].is_fast_win).toBe(true);
    });
  });

  describe("lighthouse opportunities rows", () => {
    it("extracts opportunities from both strategies", () => {
      const audit = createMinimalAudit({
        perf: {
          byStrategy: {
            mobile: {
              fetchedAt: "2024-01-15T10:00:00Z",
              url: "https://test.com/",
              categoryScore: {},
              metrics: {},
              opportunities: [
                { id: "render-blocking", title: "Remove render-blocking resources", estimatedSavingsMs: 1200 },
                { id: "unused-css", title: "Remove unused CSS", estimatedSavingsBytes: 50000 },
              ],
            },
            desktop: {
              fetchedAt: "2024-01-15T10:00:00Z",
              url: "https://test.com/",
              categoryScore: {},
              metrics: {},
              opportunities: [
                { id: "render-blocking", title: "Remove render-blocking resources", estimatedSavingsMs: 600 },
              ],
            },
          },
        },
      });

      const rows = transformAuditToBigQueryRows(audit);

      expect(rows.lighthouseOpportunities).toHaveLength(3);

      const mobileOpps = rows.lighthouseOpportunities.filter((o) => o.strategy === "mobile");
      expect(mobileOpps).toHaveLength(2);

      const desktopOpps = rows.lighthouseOpportunities.filter((o) => o.strategy === "desktop");
      expect(desktopOpps).toHaveLength(1);
    });
  });

  describe("crawl pages rows", () => {
    it("transforms crawled pages with CTAs and forms", () => {
      const audit = createMinimalAudit({
        crawl: {
          pages: [
            {
              url: "https://test.com/",
              kind: "home",
              strategy: "mobile",
              fetchedAt: "2024-01-15T10:00:00Z",
              detectedCTAs: [
                { label: "Book Now", isPrimaryGuess: true, positionHint: "above_fold" },
                { label: "Learn More", isPrimaryGuess: false, positionHint: "below_fold" },
              ],
              forms: [
                { kind: "booking", fields: ["checkin", "checkout", "guests"], submitLabel: "Search" },
              ],
              contacts: { hasPhone: true, hasEmail: true, hasAddress: false, hasLiveChat: false },
              policies: {
                hasCancellationPolicy: true,
                hasHouseRules: true,
                hasPrivacyPolicy: true,
                hasTerms: true,
              },
              trustElements: {
                hasReviewsSection: true,
                hasThirdPartyReviewBadges: false,
                hasSecurePaymentBadges: true,
                hasSocialProofMentions: false,
              },
              resources: {
                totalRequests: 85,
                totalBytes: 2500000,
                thirdPartyRequests: 25,
                thirdPartyBytes: 500000,
              },
            },
          ],
        },
      });

      const rows = transformAuditToBigQueryRows(audit);

      expect(rows.crawlPages).toHaveLength(1);
      const page = rows.crawlPages[0];

      expect(page.url).toBe("https://test.com/");
      expect(page.kind).toBe("home");
      expect(page.strategy).toBe("mobile");
      expect(page.cta_count).toBe(2);
      expect(page.primary_cta_count).toBe(1);
      expect(page.above_fold_cta_count).toBe(1);
      expect(page.cta_labels).toEqual(["Book Now", "Learn More"]);
      expect(page.form_count).toBe(1);
      expect(page.booking_form_count).toBe(1);
      expect(page.has_phone).toBe(true);
      expect(page.has_cancellation_policy).toBe(true);
      expect(page.has_reviews_section).toBe(true);
      expect(page.total_requests).toBe(85);
    });
  });

  describe("booking steps rows", () => {
    it("transforms booking path steps", () => {
      const audit = createMinimalAudit({
        crawl: {
          pages: [],
          bookingPath: {
            steps: [
              { url: "https://test.com/property/1", kind: "availability", success: true },
              {
                url: "https://test.com/book/1",
                kind: "checkout",
                success: false,
                frictionNotes: ["Requires account creation", "Hidden fees at checkout"],
              },
            ],
            clickDepthFromHome: 2,
          },
        },
      });

      const rows = transformAuditToBigQueryRows(audit);

      expect(rows.bookingSteps).toHaveLength(2);
      expect(rows.bookingSteps[0].step_index).toBe(0);
      expect(rows.bookingSteps[0].kind).toBe("availability");
      expect(rows.bookingSteps[0].success).toBe(true);

      expect(rows.bookingSteps[1].step_index).toBe(1);
      expect(rows.bookingSteps[1].kind).toBe("checkout");
      expect(rows.bookingSteps[1].success).toBe(false);
      expect(rows.bookingSteps[1].friction_notes).toEqual([
        "Requires account creation",
        "Hidden fees at checkout",
      ]);
    });
  });

  describe("module errors rows", () => {
    it("transforms module errors", () => {
      const audit = createMinimalAudit({
        errors: [
          { module: "pagespeed", severity: "error", message: "API rate limit exceeded", retriable: true },
          { module: "crawl", severity: "warn", message: "Some pages blocked by robots.txt", retriable: false },
        ],
      });

      const rows = transformAuditToBigQueryRows(audit);

      expect(rows.moduleErrors).toHaveLength(2);
      expect(rows.moduleErrors[0].module).toBe("pagespeed");
      expect(rows.moduleErrors[0].severity).toBe("error");
      expect(rows.moduleErrors[0].retriable).toBe(true);
      expect(rows.moduleErrors[1].module).toBe("crawl");
      expect(rows.moduleErrors[1].severity).toBe("warn");
      expect(rows.moduleErrors[1].retriable).toBe(false);
    });
  });

  describe("empty/partial audits", () => {
    it("handles audit with no optional fields", () => {
      const audit = createMinimalAudit();
      const rows = transformAuditToBigQueryRows(audit);

      expect(rows.audit.audit_id).toBe("test-audit-001");
      expect(rows.findings).toHaveLength(0);
      expect(rows.crawlPages).toHaveLength(0);
      expect(rows.bookingSteps).toHaveLength(0);
      expect(rows.sessionReplays).toHaveLength(0);
      expect(rows.moduleErrors).toHaveLength(0);
      expect(rows.lighthouseOpportunities).toHaveLength(0);

      // All optional fields should be null
      expect(rows.audit.overall_score).toBeNull();
      expect(rows.audit.mobile_lcp_ms).toBeNull();
      expect(rows.audit.cms).toBeNull();
    });
  });
});
