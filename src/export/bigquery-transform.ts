/**
 * Transform NormalizedAudit into BigQuery-compatible row objects
 *
 * Each function returns rows ready for insertion into the corresponding BigQuery table.
 * All timestamps are converted to BigQuery TIMESTAMP format (ISO 8601).
 */

import type {
  NormalizedAudit,
  Finding,
  CrawledPage,
  SessionReplay,
  ModuleError,
  LighthouseOpportunity,
  Strategy,
} from "../types/index.js";

// BigQuery row types
export interface AuditRow {
  audit_id: string;
  domain: string;
  status: string;
  generated_at: string;
  started_at: string | null;
  campaign_id: string | null;
  campaign_source: string | null;
  initiator_id: string | null;
  overall_score: number | null;
  projected_score: number | null;
  projected_score_with_product: number | null;
  conversion_loss_percent: number | null;
  conversion_score: number | null;
  conversion_blocker_count: number | null;
  performance_score: number | null;
  performance_blocker_count: number | null;
  trust_score: number | null;
  trust_blocker_count: number | null;
  seo_score: number | null;
  seo_blocker_count: number | null;
  security_score: number | null;
  security_blocker_count: number | null;
  content_score: number | null;
  content_blocker_count: number | null;
  mobile_lcp_ms: number | null;
  mobile_cls: number | null;
  mobile_inp_ms: number | null;
  mobile_fcp_ms: number | null;
  mobile_tbt_ms: number | null;
  mobile_speed_index_ms: number | null;
  mobile_performance_score: number | null;
  mobile_accessibility_score: number | null;
  desktop_lcp_ms: number | null;
  desktop_cls: number | null;
  desktop_inp_ms: number | null;
  desktop_fcp_ms: number | null;
  desktop_tbt_ms: number | null;
  desktop_speed_index_ms: number | null;
  desktop_performance_score: number | null;
  desktop_accessibility_score: number | null;
  cms: string | null;
  cdn: string | null;
  frameworks: string[];
  has_ga4: boolean | null;
  has_gtm: boolean | null;
  has_meta_pixel: boolean | null;
  has_google_ads_tag: boolean | null;
  booking_engine_provider: string | null;
  booking_engine_embedded: boolean | null;
  booking_engine_separate_domain: boolean | null;
  chat_widget: string | null;
  robots_txt_present: boolean | null;
  sitemap_present: boolean | null;
  has_noindex_on_money_pages: boolean | null;
  missing_titles_count: number | null;
  duplicate_titles_count: number | null;
  missing_descriptions_count: number | null;
  has_local_business_schema: boolean | null;
  has_lodging_business_schema: boolean | null;
  has_faq_schema: boolean | null;
  has_review_schema: boolean | null;
  has_company_name: boolean | null;
  has_phone: boolean | null;
  has_address: boolean | null;
  onsite_reviews_present: boolean | null;
  onsite_reviews_count: number | null;
  google_reviews_present: boolean | null;
  google_reviews_rating: number | null;
  google_reviews_count: number | null;
  has_https: boolean | null;
  has_mixed_content: boolean | null;
  ssl_labs_grade: string | null;
  has_hsts: boolean | null;
  has_csp: boolean | null;
  image_count: number | null;
  hero_image_width: number | null;
  has_video: boolean | null;
  description_word_count: number | null;
  has_direct_booking_benefits: boolean | null;
  has_local_area_content: boolean | null;
  booking_click_depth: number | null;
  booking_cross_domain: boolean | null;
  booking_cross_domain_host: string | null;
  has_persistent_booking_cta_mobile: boolean | null;
  shows_fees_before_checkout: boolean | null;
  shows_cancellation_before_checkout: boolean | null;
  requires_account_creation: boolean | null;
  supports_instant_booking: boolean | null;
  has_inquiry_fallback: boolean | null;
  screenshot_count: number | null;
  session_replay_count: number | null;
  error_count: number | null;
  top_issue_ids: string[];
  fast_win_ids: string[];
  top_contributors: string[];
  scoring_version: string | null;
  inserted_at: string;
}

export interface FindingRow {
  audit_id: string;
  finding_id: string;
  title: string;
  category: string;
  severity: string;
  impact: number;
  confidence: number;
  penalty: number;
  fix: string | null;
  effort: string | null;
  evidence: string[];
  tags: string[];
  is_top_issue: boolean;
  is_fast_win: boolean;
  ranking: number | null;
  inserted_at: string;
}

export interface CrawlPageRow {
  audit_id: string;
  url: string;
  kind: string;
  strategy: string;
  fetched_at: string | null;
  screenshot_url: string | null;
  above_fold_text: string | null;
  dom_hash: string | null;
  cta_count: number | null;
  primary_cta_count: number | null;
  above_fold_cta_count: number | null;
  cta_labels: string[];
  form_count: number | null;
  booking_form_count: number | null;
  inquiry_form_count: number | null;
  has_phone: boolean | null;
  has_email: boolean | null;
  has_address: boolean | null;
  has_live_chat: boolean | null;
  has_cancellation_policy: boolean | null;
  has_house_rules: boolean | null;
  has_privacy_policy: boolean | null;
  has_terms: boolean | null;
  has_reviews_section: boolean | null;
  has_third_party_review_badges: boolean | null;
  has_secure_payment_badges: boolean | null;
  has_social_proof_mentions: boolean | null;
  total_requests: number | null;
  total_bytes: number | null;
  third_party_requests: number | null;
  third_party_bytes: number | null;
  has_cookie_banner_blocking_ui: boolean | null;
  inserted_at: string;
}

export interface BookingStepRow {
  audit_id: string;
  step_index: number;
  url: string;
  kind: string;
  success: boolean;
  friction_notes: string[];
  inserted_at: string;
}

export interface SessionReplayRow {
  audit_id: string;
  strategy: string;
  replay_url: string;
  video_url: string | null;
  duration_ms: number;
  started_at: string | null;
  viewport_width: number | null;
  viewport_height: number | null;
  reached_booking: boolean;
  blocked_reason: string | null;
  marker_count: number | null;
  inserted_at: string;
}

export interface ModuleErrorRow {
  audit_id: string;
  module: string;
  severity: string;
  message: string;
  retriable: boolean;
  inserted_at: string;
}

export interface LighthouseOpportunityRow {
  audit_id: string;
  strategy: string;
  opportunity_id: string;
  title: string;
  description: string | null;
  estimated_savings_ms: number | null;
  estimated_savings_bytes: number | null;
  inserted_at: string;
}

// All rows for a single audit
export interface BigQueryRows {
  audit: AuditRow;
  findings: FindingRow[];
  crawlPages: CrawlPageRow[];
  bookingSteps: BookingStepRow[];
  sessionReplays: SessionReplayRow[];
  moduleErrors: ModuleErrorRow[];
  lighthouseOpportunities: LighthouseOpportunityRow[];
}

/**
 * Transform a NormalizedAudit into all BigQuery rows
 */
export function transformAuditToBigQueryRows(audit: NormalizedAudit): BigQueryRows {
  const insertedAt = new Date().toISOString();

  return {
    audit: transformAuditRow(audit, insertedAt),
    findings: transformFindings(audit, insertedAt),
    crawlPages: transformCrawlPages(audit, insertedAt),
    bookingSteps: transformBookingSteps(audit, insertedAt),
    sessionReplays: transformSessionReplays(audit, insertedAt),
    moduleErrors: transformModuleErrors(audit, insertedAt),
    lighthouseOpportunities: transformLighthouseOpportunities(audit, insertedAt),
  };
}

/**
 * Transform main audit row
 */
function transformAuditRow(audit: NormalizedAudit, insertedAt: string): AuditRow {
  const { scoring, perf, tech, seo, trust, security, content, crawl, artifacts, errors, inputs } =
    audit;

  const mobile = perf?.byStrategy?.mobile;
  const desktop = perf?.byStrategy?.desktop;

  return {
    audit_id: audit.auditId,
    domain: audit.domain,
    status: audit.status,
    generated_at: audit.generatedAt,
    started_at: inputs.startedAt ?? null,

    // Campaign
    campaign_id: inputs.campaign?.id ?? null,
    campaign_source: inputs.campaign?.source ?? null,
    initiator_id: inputs.campaign?.initiatorId ?? null,

    // Scoring
    overall_score: scoring?.overallScore ?? null,
    projected_score: scoring?.projectedScore ?? null,
    projected_score_with_product: scoring?.projectedScoreWithProduct ?? null,
    conversion_loss_percent: scoring?.estimatedImpact?.conversionLossPercent ?? null,

    // Category scores
    conversion_score: scoring?.categoryScores?.conversion?.score ?? null,
    conversion_blocker_count: scoring?.categoryScores?.conversion?.blockerCount ?? null,
    performance_score: scoring?.categoryScores?.performance?.score ?? null,
    performance_blocker_count: scoring?.categoryScores?.performance?.blockerCount ?? null,
    trust_score: scoring?.categoryScores?.trust?.score ?? null,
    trust_blocker_count: scoring?.categoryScores?.trust?.blockerCount ?? null,
    seo_score: scoring?.categoryScores?.seo?.score ?? null,
    seo_blocker_count: scoring?.categoryScores?.seo?.blockerCount ?? null,
    security_score: scoring?.categoryScores?.security?.score ?? null,
    security_blocker_count: scoring?.categoryScores?.security?.blockerCount ?? null,
    content_score: scoring?.categoryScores?.content?.score ?? null,
    content_blocker_count: scoring?.categoryScores?.content?.blockerCount ?? null,

    // Mobile metrics
    mobile_lcp_ms: mobile?.metrics?.lcpMs ?? null,
    mobile_cls: mobile?.metrics?.cls ?? null,
    mobile_inp_ms: mobile?.metrics?.inpMs ?? null,
    mobile_fcp_ms: mobile?.metrics?.fcpMs ?? null,
    mobile_tbt_ms: mobile?.metrics?.tbtMs ?? null,
    mobile_speed_index_ms: mobile?.metrics?.speedIndexMs ?? null,
    mobile_performance_score: mobile?.categoryScore?.performance ?? null,
    mobile_accessibility_score: mobile?.categoryScore?.accessibility ?? null,

    // Desktop metrics
    desktop_lcp_ms: desktop?.metrics?.lcpMs ?? null,
    desktop_cls: desktop?.metrics?.cls ?? null,
    desktop_inp_ms: desktop?.metrics?.inpMs ?? null,
    desktop_fcp_ms: desktop?.metrics?.fcpMs ?? null,
    desktop_tbt_ms: desktop?.metrics?.tbtMs ?? null,
    desktop_speed_index_ms: desktop?.metrics?.speedIndexMs ?? null,
    desktop_performance_score: desktop?.categoryScore?.performance ?? null,
    desktop_accessibility_score: desktop?.categoryScore?.accessibility ?? null,

    // Tech signals
    cms: tech?.cms ?? null,
    cdn: tech?.cdn ?? null,
    frameworks: tech?.frameworks ?? [],
    has_ga4: tech?.analytics?.hasGA4 ?? null,
    has_gtm: tech?.analytics?.hasGTM ?? null,
    has_meta_pixel: tech?.analytics?.hasMetaPixel ?? null,
    has_google_ads_tag: tech?.analytics?.hasGoogleAdsTag ?? null,
    booking_engine_provider: tech?.bookingEngine?.provider ?? null,
    booking_engine_embedded: tech?.bookingEngine?.embedded ?? null,
    booking_engine_separate_domain: tech?.bookingEngine?.separateDomain ?? null,
    chat_widget: tech?.chatWidget ?? null,

    // SEO signals
    robots_txt_present: seo?.indexability?.robotsTxtPresent ?? null,
    sitemap_present: seo?.indexability?.sitemapPresent ?? null,
    has_noindex_on_money_pages: seo?.indexability?.hasNoindexOnMoneyPages ?? null,
    missing_titles_count: seo?.meta?.missingTitlesCount ?? null,
    duplicate_titles_count: seo?.meta?.duplicateTitlesCount ?? null,
    missing_descriptions_count: seo?.meta?.missingDescriptionsCount ?? null,
    has_local_business_schema: seo?.schema?.hasLocalBusiness ?? null,
    has_lodging_business_schema: seo?.schema?.hasLodgingBusiness ?? null,
    has_faq_schema: seo?.schema?.hasFAQ ?? null,
    has_review_schema: seo?.schema?.hasReview ?? null,

    // Trust signals
    has_company_name: trust?.businessIdentity?.hasCompanyName ?? null,
    has_phone: trust?.businessIdentity?.hasPhone ?? null,
    has_address: trust?.businessIdentity?.hasAddress ?? null,
    onsite_reviews_present: trust?.reviews?.onSite?.present ?? null,
    onsite_reviews_count: trust?.reviews?.onSite?.countHint ?? null,
    google_reviews_present: trust?.reviews?.google?.present ?? null,
    google_reviews_rating: trust?.reviews?.google?.rating ?? null,
    google_reviews_count: trust?.reviews?.google?.count ?? null,

    // Security signals
    has_https: security?.tls?.hasHttps ?? null,
    has_mixed_content: security?.tls?.mixedContent ?? null,
    ssl_labs_grade: security?.tls?.sslLabsGrade ?? null,
    has_hsts: security?.headers?.hsts ?? null,
    has_csp: security?.headers?.csp ?? null,

    // Content signals
    image_count: content?.imageCount ?? null,
    hero_image_width: content?.heroImageWidth ?? null,
    has_video: content?.hasVideo ?? null,
    description_word_count: content?.descriptionWordCount ?? null,
    has_direct_booking_benefits: content?.hasDirectBookingBenefits ?? null,
    has_local_area_content: content?.hasLocalAreaContent ?? null,

    // Booking path
    booking_click_depth: crawl?.bookingPath?.clickDepthFromHome ?? null,
    booking_cross_domain: crawl?.bookingPath?.crossDomain ?? null,
    booking_cross_domain_host: crawl?.bookingPath?.crossDomainHost ?? null,

    // Conversion signals
    has_persistent_booking_cta_mobile: crawl?.conversionElements?.hasPersistentBookingCTAOnMobile ?? null,
    shows_fees_before_checkout: crawl?.conversionElements?.showsFeesBeforeCheckout ?? null,
    shows_cancellation_before_checkout: crawl?.conversionElements?.showsCancellationBeforeCheckout ?? null,
    requires_account_creation: crawl?.conversionElements?.requiresAccountCreation ?? null,
    supports_instant_booking: crawl?.conversionElements?.supportsInstantBooking ?? null,
    has_inquiry_fallback: crawl?.conversionElements?.hasInquiryFallback ?? null,

    // Artifact counts
    screenshot_count: artifacts?.screenshots?.length ?? null,
    session_replay_count: artifacts?.sessionReplays?.length ?? null,
    error_count: errors?.length ?? null,

    // Issue summaries
    top_issue_ids: scoring?.topIssues?.map((f) => f.id) ?? [],
    fast_win_ids: scoring?.fastWins?.map((f) => f.id) ?? [],
    top_contributors: scoring?.estimatedImpact?.topContributors ?? [],

    scoring_version: scoring?.version ?? null,
    inserted_at: insertedAt,
  };
}

/**
 * Transform findings from all categories, topIssues, and fastWins
 */
function transformFindings(audit: NormalizedAudit, insertedAt: string): FindingRow[] {
  const { scoring, auditId } = audit;
  if (!scoring) return [];

  const topIssueIds = new Set(scoring.topIssues?.map((f) => f.id) ?? []);
  const fastWinIds = new Set(scoring.fastWins?.map((f) => f.id) ?? []);

  // Collect all unique findings
  const findingsMap = new Map<string, Finding>();

  // From category scores
  for (const categoryScore of Object.values(scoring.categoryScores)) {
    for (const finding of categoryScore.findings) {
      findingsMap.set(finding.id, finding);
    }
  }

  // From topIssues and fastWins (in case they have extras)
  for (const finding of scoring.topIssues ?? []) {
    findingsMap.set(finding.id, finding);
  }
  for (const finding of scoring.fastWins ?? []) {
    findingsMap.set(finding.id, finding);
  }

  // Transform to rows
  const rows: FindingRow[] = [];
  for (const finding of findingsMap.values()) {
    const topIssueIndex = scoring.topIssues?.findIndex((f) => f.id === finding.id) ?? -1;
    const fastWinIndex = scoring.fastWins?.findIndex((f) => f.id === finding.id) ?? -1;

    rows.push({
      audit_id: auditId,
      finding_id: finding.id,
      title: finding.title,
      category: finding.category,
      severity: finding.severity,
      impact: finding.impact,
      confidence: finding.confidence,
      penalty: finding.penalty,
      fix: finding.fix ?? null,
      effort: finding.effort ?? null,
      evidence: finding.evidence ?? [],
      tags: finding.tags ?? [],
      is_top_issue: topIssueIds.has(finding.id),
      is_fast_win: fastWinIds.has(finding.id),
      ranking: topIssueIndex >= 0 ? topIssueIndex + 1 : fastWinIndex >= 0 ? fastWinIndex + 1 : null,
      inserted_at: insertedAt,
    });
  }

  return rows;
}

/**
 * Transform crawled pages
 */
function transformCrawlPages(audit: NormalizedAudit, insertedAt: string): CrawlPageRow[] {
  const { crawl, auditId } = audit;
  if (!crawl?.pages) return [];

  return crawl.pages.map((page: CrawledPage) => ({
    audit_id: auditId,
    url: page.url,
    kind: page.kind,
    strategy: page.strategy,
    fetched_at: page.fetchedAt ?? null,
    screenshot_url: page.screenshotUrl ?? null,
    above_fold_text: page.aboveFoldText ?? null,
    dom_hash: page.domHash ?? null,

    // CTAs
    cta_count: page.detectedCTAs?.length ?? null,
    primary_cta_count: page.detectedCTAs?.filter((c) => c.isPrimaryGuess).length ?? null,
    above_fold_cta_count:
      page.detectedCTAs?.filter((c) => c.positionHint === "above_fold").length ?? null,
    cta_labels: page.detectedCTAs?.map((c) => c.label) ?? [],

    // Forms
    form_count: page.forms?.length ?? null,
    booking_form_count: page.forms?.filter((f) => f.kind === "booking").length ?? null,
    inquiry_form_count: page.forms?.filter((f) => f.kind === "inquiry").length ?? null,

    // Contact
    has_phone: page.contacts?.hasPhone ?? null,
    has_email: page.contacts?.hasEmail ?? null,
    has_address: page.contacts?.hasAddress ?? null,
    has_live_chat: page.contacts?.hasLiveChat ?? null,

    // Policies
    has_cancellation_policy: page.policies?.hasCancellationPolicy ?? null,
    has_house_rules: page.policies?.hasHouseRules ?? null,
    has_privacy_policy: page.policies?.hasPrivacyPolicy ?? null,
    has_terms: page.policies?.hasTerms ?? null,

    // Trust elements
    has_reviews_section: page.trustElements?.hasReviewsSection ?? null,
    has_third_party_review_badges: page.trustElements?.hasThirdPartyReviewBadges ?? null,
    has_secure_payment_badges: page.trustElements?.hasSecurePaymentBadges ?? null,
    has_social_proof_mentions: page.trustElements?.hasSocialProofMentions ?? null,

    // Resources
    total_requests: page.resources?.totalRequests ?? null,
    total_bytes: page.resources?.totalBytes ?? null,
    third_party_requests: page.resources?.thirdPartyRequests ?? null,
    third_party_bytes: page.resources?.thirdPartyBytes ?? null,
    has_cookie_banner_blocking_ui: page.resources?.hasCookieBannerBlockingUI ?? null,

    inserted_at: insertedAt,
  }));
}

/**
 * Transform booking path steps
 */
function transformBookingSteps(audit: NormalizedAudit, insertedAt: string): BookingStepRow[] {
  const { crawl, auditId } = audit;
  if (!crawl?.bookingPath?.steps) return [];

  return crawl.bookingPath.steps.map((step, index) => ({
    audit_id: auditId,
    step_index: index,
    url: step.url,
    kind: step.kind,
    success: step.success,
    friction_notes: step.frictionNotes ?? [],
    inserted_at: insertedAt,
  }));
}

/**
 * Transform session replays
 */
function transformSessionReplays(audit: NormalizedAudit, insertedAt: string): SessionReplayRow[] {
  const { artifacts, auditId } = audit;
  if (!artifacts?.sessionReplays) return [];

  return artifacts.sessionReplays.map((replay: SessionReplay) => ({
    audit_id: auditId,
    strategy: replay.strategy,
    replay_url: replay.replayUrl,
    video_url: replay.videoUrl ?? null,
    duration_ms: replay.durationMs,
    started_at: replay.startedAt ?? null,
    viewport_width: replay.viewportWidth ?? null,
    viewport_height: replay.viewportHeight ?? null,
    reached_booking: replay.reachedBooking,
    blocked_reason: replay.blockedReason ?? null,
    marker_count: replay.markers?.length ?? null,
    inserted_at: insertedAt,
  }));
}

/**
 * Transform module errors
 */
function transformModuleErrors(audit: NormalizedAudit, insertedAt: string): ModuleErrorRow[] {
  const { errors, auditId } = audit;
  if (!errors) return [];

  return errors.map((error: ModuleError) => ({
    audit_id: auditId,
    module: error.module,
    severity: error.severity,
    message: error.message,
    retriable: error.retriable,
    inserted_at: insertedAt,
  }));
}

/**
 * Transform lighthouse opportunities from both strategies
 */
function transformLighthouseOpportunities(
  audit: NormalizedAudit,
  insertedAt: string
): LighthouseOpportunityRow[] {
  const { perf, auditId } = audit;
  if (!perf?.byStrategy) return [];

  const rows: LighthouseOpportunityRow[] = [];

  for (const strategy of ["mobile", "desktop"] as Strategy[]) {
    const result = perf.byStrategy[strategy];
    if (!result?.opportunities) continue;

    for (const opp of result.opportunities) {
      rows.push({
        audit_id: auditId,
        strategy,
        opportunity_id: opp.id,
        title: opp.title,
        description: opp.description ?? null,
        estimated_savings_ms: opp.estimatedSavingsMs ?? null,
        estimated_savings_bytes: opp.estimatedSavingsBytes ?? null,
        inserted_at: insertedAt,
      });
    }
  }

  return rows;
}
