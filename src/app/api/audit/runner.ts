// Audit runner with progress callback support

import {
  analyzeBookingFlow,
  type BookingFlowAnalysis,
} from "@/services/audit/checks/booking-flow";
import {
  analyzeTrustSignals,
  type TrustSignalAnalysis,
} from "@/services/audit/checks/trust-signals";

// Core Web Vitals extracted from either CrUX or Lighthouse
interface CoreWebVitals {
  LCP: { value: number; rating: string; source: "field" | "lab" };
  FID: { value: number; rating: string; source: "field" | "lab" } | null;
  CLS: { value: number; rating: string; source: "field" | "lab" };
  FCP: { value: number; rating: string; source: "field" | "lab" };
  TBT: { value: number; rating: string; source: "lab" } | null;
}

// Extract Core Web Vitals from PageSpeed data (CrUX first, Lighthouse fallback)
function extractCoreWebVitals(data: PageSpeedResult | null): CoreWebVitals | null {
  if (!data) return null;

  const crux = data.loadingExperience?.metrics;
  const audits = data.lighthouseResult?.audits;

  // Helper to rate metrics
  const rateLCP = (ms: number) => ms <= 2500 ? "good" : ms <= 4000 ? "needs-improvement" : "poor";
  const rateFID = (ms: number) => ms <= 100 ? "good" : ms <= 300 ? "needs-improvement" : "poor";
  const rateCLS = (score: number) => score <= 0.1 ? "good" : score <= 0.25 ? "needs-improvement" : "poor";
  const rateFCP = (ms: number) => ms <= 1800 ? "good" : ms <= 3000 ? "needs-improvement" : "poor";
  const rateTBT = (ms: number) => ms <= 200 ? "good" : ms <= 600 ? "needs-improvement" : "poor";

  // Try CrUX (field data) first
  if (crux?.LARGEST_CONTENTFUL_PAINT_MS) {
    return {
      LCP: { value: crux.LARGEST_CONTENTFUL_PAINT_MS.percentile, rating: crux.LARGEST_CONTENTFUL_PAINT_MS.category, source: "field" },
      FID: crux.FIRST_INPUT_DELAY_MS ? { value: crux.FIRST_INPUT_DELAY_MS.percentile, rating: crux.FIRST_INPUT_DELAY_MS.category, source: "field" } : null,
      CLS: { value: crux.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile || 0, rating: crux.CUMULATIVE_LAYOUT_SHIFT_SCORE?.category || "good", source: "field" },
      FCP: { value: crux.FIRST_CONTENTFUL_PAINT_MS?.percentile || 0, rating: crux.FIRST_CONTENTFUL_PAINT_MS?.category || "good", source: "field" },
      TBT: null,
    };
  }

  // Fallback to Lighthouse (lab data)
  if (audits) {
    const lcp = audits["largest-contentful-paint"]?.numericValue || 0;
    const cls = audits["cumulative-layout-shift"]?.numericValue || 0;
    const fcp = audits["first-contentful-paint"]?.numericValue || 0;
    const tbt = audits["total-blocking-time"]?.numericValue || 0;

    return {
      LCP: { value: Math.round(lcp), rating: rateLCP(lcp), source: "lab" },
      FID: null, // FID not available in lab data
      CLS: { value: Number(cls.toFixed(3)), rating: rateCLS(cls), source: "lab" },
      FCP: { value: Math.round(fcp), rating: rateFCP(fcp), source: "lab" },
      TBT: { value: Math.round(tbt), rating: rateTBT(tbt), source: "lab" },
    };
  }

  return null;
}

// PageSpeed Insights API types
interface PageSpeedResult {
  lighthouseResult?: {
    categories: {
      performance?: { score: number };
      accessibility?: { score: number };
      "best-practices"?: { score: number };
      seo?: { score: number };
    };
    audits: Record<
      string,
      {
        score: number | null;
        displayValue?: string;
        numericValue?: number;
      }
    >;
  };
  loadingExperience?: {
    metrics: {
      LARGEST_CONTENTFUL_PAINT_MS?: { percentile: number; category: string };
      FIRST_INPUT_DELAY_MS?: { percentile: number; category: string };
      CUMULATIVE_LAYOUT_SHIFT_SCORE?: { percentile: number; category: string };
      FIRST_CONTENTFUL_PAINT_MS?: { percentile: number; category: string };
    };
  };
}

// SEO Data types (from DataForSEO or SEMrush)
interface SEOMetricsData {
  organic_traffic?: number;
  organic_keywords?: number;
  backlinks?: number;
  domain_rank?: number;
  authority_score?: number;
  source?: "dataforseo" | "semrush" | "none";
}

type ProgressCallback = (progress: number, step: string) => void;

// Request info for curl command generation
interface RequestInfo {
  method: "GET" | "POST";
  url: string;
  headers: Record<string, string>;
  body?: string;
}

// SEMrush parsed data types
interface SEMrushKeyword {
  keyword: string;
  position: number;
  previousPosition: number | null;
  searchVolume: number;
  traffic: number;
  trafficPercent: number;
  cpc: number;
  url: string;
}

interface SEMrushRefDomain {
  domain: string;
  backlinksCount: number;
  firstSeen: string;
  lastSeen: string;
}

interface SEMrushParsedData {
  domainRanks: {
    rank: number;
    organicKeywords: number;
    organicTraffic: number;
    organicCost: number;
    adwordsKeywords: number;
    adwordsTraffic: number;
    adwordsCost: number;
  } | null;
  backlinks: {
    authorityScore: number;
    totalBacklinks: number;
    referringDomains: number;
    referringUrls: number;
    referringIps: number;
    followLinks: number;
    nofollowLinks: number;
  } | null;
  topKeywords: SEMrushKeyword[];
  refDomains: SEMrushRefDomain[];
}

// Raw API response storage with request details
interface RawApiData {
  pageSpeed: { request: RequestInfo; response: unknown } | null;
  dataForSEO: { request: RequestInfo; response: unknown } | null;
  semrush: {
    request: RequestInfo;
    response: unknown;
    parsed?: SEMrushParsedData;
  } | null;
  htmlFetch: {
    request: RequestInfo;
    response: {
      statusCode: number;
      contentLength: number;
      headers: Record<string, string>;
      loadTimeMs: number;
      fetchedAt: string;
      error?: string;
    };
  } | null;
}

export async function runAudit(
  url: string,
  domain: string,
  onProgress?: ProgressCallback
) {
  const startTime = Date.now();
  const updateProgress = onProgress || (() => {});

  // Initialize raw data storage
  const rawApiData: RawApiData = {
    pageSpeed: null,
    dataForSEO: null,
    semrush: null,
    htmlFetch: null,
  };

  // Step 1: Fetch page
  updateProgress(20, "Fetching website content...");
  const pageData = await fetchPage(url);
  rawApiData.htmlFetch = {
    request: {
      method: "GET",
      url,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; GetHostAI-Audit/1.0; +https://gethost.ai)",
      },
    },
    response: {
      statusCode: pageData.status,
      contentLength: pageData.html?.length || 0,
      headers: pageData.headers || {},
      loadTimeMs: pageData.loadTimeMs,
      fetchedAt: new Date().toISOString(),
      error: pageData.error,
    },
  };

  // Step 2: Fetch external data in parallel
  updateProgress(40, "Analyzing performance metrics...");
  const [pageSpeedResult, seoResult] = await Promise.all([
    fetchPageSpeedInsightsWithRaw(url),
    fetchSEODataWithRaw(domain),
  ]);

  const pageSpeedData = pageSpeedResult.processed;
  const seoData = seoResult.processed;
  const dataForSEOMetrics = seoResult.dataForSEOProcessed;
  const semrushMetrics = seoResult.semrushProcessed;
  rawApiData.pageSpeed = pageSpeedResult.raw;
  rawApiData.dataForSEO = seoResult.dataForSEORaw;
  rawApiData.semrush = seoResult.semrushRaw;

  // Step 3: Analyze the page HTML
  updateProgress(50, "Scanning for conversion elements...");
  const analysis = analyzePage(pageData, domain);

  // Step 4: Run STR-specific analysis
  updateProgress(60, "Analyzing booking flow...");
  const bookingFlowAnalysis = analyzeBookingFlow(pageData.html);

  updateProgress(70, "Analyzing trust signals...");
  const trustSignalAnalysis = analyzeTrustSignals(pageData.html);

  // Step 5: Calculate scores
  updateProgress(85, "Calculating scores...");
  const scores = calculateScores(
    analysis,
    pageSpeedData,
    seoData,
    bookingFlowAnalysis,
    trustSignalAnalysis
  );

  // Step 6: Compile recommendations
  updateProgress(90, "Generating recommendations...");
  const allRecommendations = [
    ...analysis.recommendations,
    ...getBookingFlowRecommendations(bookingFlowAnalysis),
    ...getTrustSignalRecommendations(trustSignalAnalysis),
    ...getPageSpeedRecommendations(pageSpeedData),
    ...getSEORecommendations(seoData),
  ];

  updateProgress(100, "Complete");

  return {
    domain,
    timestamp: new Date().toISOString(),
    overallScore: scores.overall,
    projectedScore: Math.min(95, scores.overall + 25),
    monthlyRevenueLoss: estimateRevenueLoss(scores.overall, seoData),
    summary: generateSummary(scores.overall),
    categories: scores.categories,
    recommendations: allRecommendations,
    competitors: [],
    coreWebVitals: extractCoreWebVitals(pageSpeedData),
    lighthouseScores: pageSpeedData?.lighthouseResult?.categories || null,
    seoMetrics: seoData || null,
    dataForSEOMetrics: dataForSEOMetrics || null,
    semrushMetrics: semrushMetrics || null,
    // STR-specific analysis
    bookingFlow: {
      hasBookingCTA: bookingFlowAnalysis.hasBookingCTA,
      ctaText: bookingFlowAnalysis.ctaText,
      ctaLocation: bookingFlowAnalysis.ctaLocation,
      bookingEngine: bookingFlowAnalysis.bookingEngine,
      hasDatePicker: bookingFlowAnalysis.hasDatePicker,
      hasInstantBook: bookingFlowAnalysis.hasInstantBook,
      estimatedClicksToBook: bookingFlowAnalysis.estimatedClicksToBook,
      frictionScore: bookingFlowAnalysis.frictionScore,
    },
    trustSignals: {
      overallTrustScore: trustSignalAnalysis.overallTrustScore,
      hasReviews: trustSignalAnalysis.hasReviews,
      reviewSource: trustSignalAnalysis.reviewSource,
      reviewCount: trustSignalAnalysis.reviewCount,
      averageRating: trustSignalAnalysis.averageRating,
      trustBadges: trustSignalAnalysis.trustBadges,
      hasPhoneNumber: trustSignalAnalysis.hasPhoneNumber,
      hasEmailAddress: trustSignalAnalysis.hasEmailAddress,
      hasPhysicalAddress: trustSignalAnalysis.hasPhysicalAddress,
      hasSocialProfiles: trustSignalAnalysis.hasSocialProfiles,
      hasPrivacyPolicy: trustSignalAnalysis.hasPrivacyPolicy,
    },
    meta: {
      fetchTimeMs: Date.now() - startTime,
      url,
      dataSourcesUsed: {
        htmlAnalysis: true,
        pageSpeed: !!pageSpeedData?.lighthouseResult,
        coreWebVitals: !!extractCoreWebVitals(pageSpeedData),
        seoData: !!seoData,
        bookingFlowAnalysis: true,
        trustSignalAnalysis: true,
      },
      notes: [
        ...(!pageSpeedData?.lighthouseResult
          ? ["PageSpeed API unavailable - add PAGESPEED_API_KEY for Lighthouse data"]
          : []),
        ...(seoData
          ? [`SEO data from ${seoData.source || "unknown"}`]
          : []),
      ],
    },
    // Raw API responses for debugging and analysis
    rawApiData,
  };
}

async function fetchPage(url: string): Promise<{
  html: string;
  status: number;
  headers: Record<string, string>;
  loadTimeMs: number;
  error?: string;
}> {
  const start = Date.now();

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; GetHostAI-Audit/1.0; +https://gethost.ai)",
      },
      redirect: "follow",
    });

    const html = await response.text();
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return {
      html,
      status: response.status,
      headers,
      loadTimeMs: Date.now() - start,
    };
  } catch (error) {
    return {
      html: "",
      status: 0,
      headers: {},
      loadTimeMs: Date.now() - start,
      error: String(error),
    };
  }
}

// Wrapper function that returns both raw and processed PageSpeed data
async function fetchPageSpeedInsightsWithRaw(
  url: string
): Promise<{ processed: PageSpeedResult | null; raw: { request: RequestInfo; response: unknown } }> {
  const apiKey = process.env.PAGESPEED_API_KEY || "";
  const apiUrl = new URL(
    "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
  );
  apiUrl.searchParams.set("url", url);
  apiUrl.searchParams.set("strategy", "mobile");
  // Add each category as a separate parameter
  ["performance", "accessibility", "best-practices", "seo"].forEach((cat) => {
    apiUrl.searchParams.append("category", cat);
  });
  if (apiKey) {
    apiUrl.searchParams.set("key", apiKey);
  }

  const requestInfo: RequestInfo = {
    method: "GET",
    url: apiUrl.toString(),
    headers: { Accept: "application/json" },
  };

  try {
    console.log("[PageSpeed] Fetching:", apiUrl.toString().replace(/key=[^&]+/, "key=***"));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    const response = await fetch(apiUrl.toString(), {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await response.json();

    if (data.error) {
      console.warn(`[PageSpeed] API error: ${data.error.message}`);
      return { processed: null, raw: { request: requestInfo, response: data } };
    }

    if (!response.ok) {
      console.warn(`[PageSpeed] Response not ok: ${response.status}`);
      return { processed: null, raw: { request: requestInfo, response: data } };
    }

    console.log("[PageSpeed] Success, performance score:", data.lighthouseResult?.categories?.performance?.score);
    return { processed: data as PageSpeedResult, raw: { request: requestInfo, response: data } };
  } catch (error) {
    console.error("[PageSpeed] Fetch failed:", error);
    return { processed: null, raw: { request: requestInfo, response: { error: String(error) } } };
  }
}

// Wrapper function that returns both raw and processed SEO data
// Always calls both DataForSEO and SEMrush for comparison
async function fetchSEODataWithRaw(
  domain: string
): Promise<{
  processed: SEOMetricsData | null;
  dataForSEOProcessed: SEOMetricsData | null;
  semrushProcessed: SEOMetricsData | null;
  dataForSEORaw: { request: RequestInfo; response: unknown } | null;
  semrushRaw: { request: RequestInfo; response: unknown } | null;
}> {
  // Call both APIs in parallel for richer data
  const [dataForSEOResult, semrushResult] = await Promise.all([
    fetchDataForSEOWithRaw(domain),
    fetchSEMrushWithRaw(domain),
  ]);

  // Prefer DataForSEO for primary processed data, fallback to SEMrush
  const processed = dataForSEOResult.processed || semrushResult.processed;

  return {
    processed,
    dataForSEOProcessed: dataForSEOResult.processed,
    semrushProcessed: semrushResult.processed,
    dataForSEORaw: dataForSEOResult.raw,
    semrushRaw: semrushResult.raw,
  };
}

async function fetchDataForSEOWithRaw(
  domain: string
): Promise<{ processed: SEOMetricsData | null; raw: { request: RequestInfo; response: unknown } }> {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  const apiUrl = "https://api.dataforseo.com/v3/dataforseo_labs/google/domain_rank_overview/live";
  const requestBody = JSON.stringify([{
    target: domain,
    location_code: 2840, // US
    language_code: "en",
  }]);

  const requestInfo: RequestInfo = {
    method: "POST",
    url: apiUrl,
    headers: {
      Authorization: login && password
        ? "Basic " + Buffer.from(`${login}:${password}`).toString("base64")
        : "Basic <DATAFORSEO_LOGIN:DATAFORSEO_PASSWORD>",
      "Content-Type": "application/json",
    },
    body: requestBody,
  };

  if (!login || !password) {
    console.log("[DataForSEO] No credentials found");
    return { processed: null, raw: { request: requestInfo, response: { error: "No credentials configured" } } };
  }

  try {
    console.log("[DataForSEO] Fetching domain rank for:", domain);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    // Use DataForSEO Labs domain_rank_overview for SEO metrics
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${login}:${password}`).toString("base64"),
        "Content-Type": "application/json",
      },
      body: requestBody,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await response.json();
    console.log("[DataForSEO] Response status_code:", data.status_code);

    if (data.status_code !== 20000 || !data.tasks?.[0]?.result?.[0]?.items?.[0]) {
      console.warn("[DataForSEO] Domain rank error:", data.status_message || "No data");
      return { processed: null, raw: { request: requestInfo, response: data } };
    }

    const metrics = data.tasks[0].result[0].items[0].metrics;
    const organic = metrics?.organic || {};

    console.log("[DataForSEO] Success, keywords:", organic.count, "traffic:", organic.etv);
    return {
      processed: {
        organic_keywords: organic.count || 0,
        organic_traffic: Math.round(organic.etv || 0), // Estimated traffic value
        backlinks: 0, // Would need separate backlinks API call
        domain_rank: organic.pos_1 || 0, // Keywords in position 1
        authority_score: calculateAuthorityScore(organic),
        source: "dataforseo",
      },
      raw: { request: requestInfo, response: data },
    };
  } catch (error) {
    console.error("[DataForSEO] Fetch failed:", error);
    return { processed: null, raw: { request: requestInfo, response: { error: String(error) } } };
  }
}

// Calculate an authority score based on keyword positions
function calculateAuthorityScore(organic: {
  pos_1?: number;
  pos_2_3?: number;
  pos_4_10?: number;
  count?: number;
  etv?: number;
}): number {
  if (!organic.count) return 0;

  // Weight keywords by position - top positions are more valuable
  const topKeywords = (organic.pos_1 || 0) * 3 +
                      (organic.pos_2_3 || 0) * 2 +
                      (organic.pos_4_10 || 0);
  const totalKeywords = organic.count || 1;

  // Calculate ratio of good positions to total, scaled to 100
  const positionScore = Math.min(100, (topKeywords / totalKeywords) * 100 * 5);

  // Also factor in total traffic
  const trafficScore = Math.min(100, Math.log10((organic.etv || 1) + 1) * 15);

  return Math.round((positionScore + trafficScore) / 2);
}

async function fetchSEMrushWithRaw(
  domain: string
): Promise<{ processed: SEOMetricsData | null; raw: { request: RequestInfo; response: unknown; parsed?: SEMrushParsedData } }> {
  const apiKey = process.env.SEMRUSH_API_KEY;

  if (!apiKey) {
    const placeholderUrl = `https://api.semrush.com/?type=domain_ranks&key=<SEMRUSH_API_KEY>&domain=${domain}`;
    return {
      processed: null,
      raw: {
        request: { method: "GET", url: placeholderUrl, headers: {} },
        response: { error: "No API key configured" },
      },
    };
  }

  // Build all SEMrush API URLs
  // 1. Domain Ranks - overall domain metrics
  const ranksUrl = new URL("https://api.semrush.com/");
  ranksUrl.searchParams.set("type", "domain_ranks");
  ranksUrl.searchParams.set("key", apiKey);
  ranksUrl.searchParams.set("export_columns", "Db,Dn,Rk,Or,Ot,Oc,Ad,At,Ac");
  ranksUrl.searchParams.set("domain", domain);
  ranksUrl.searchParams.set("database", "us");

  // 2. Backlinks Overview - authority score and backlink counts
  const backlinksUrl = new URL("https://api.semrush.com/analytics/v1/");
  backlinksUrl.searchParams.set("type", "backlinks_overview");
  backlinksUrl.searchParams.set("key", apiKey);
  backlinksUrl.searchParams.set("target", domain);
  backlinksUrl.searchParams.set("target_type", "root_domain");
  backlinksUrl.searchParams.set("export_columns", "ascore,total,domains_num,urls_num,ips_num,follows_num,nofollows_num");

  // 3. Domain Organic - top ranking keywords (top 20)
  const organicUrl = new URL("https://api.semrush.com/");
  organicUrl.searchParams.set("type", "domain_organic");
  organicUrl.searchParams.set("key", apiKey);
  organicUrl.searchParams.set("domain", domain);
  organicUrl.searchParams.set("database", "us");
  organicUrl.searchParams.set("display_limit", "20");
  organicUrl.searchParams.set("display_sort", "tr_desc"); // Sort by traffic descending
  organicUrl.searchParams.set("export_columns", "Ph,Po,Pp,Nq,Cp,Tr,Tc,Ur"); // Keyword, Position, Previous Position, Volume, CPC, Traffic%, TrafficCost, URL

  // 4. Backlinks Referring Domains - top 20 referring domains
  const refDomainsUrl = new URL("https://api.semrush.com/analytics/v1/");
  refDomainsUrl.searchParams.set("type", "backlinks_refdomains");
  refDomainsUrl.searchParams.set("key", apiKey);
  refDomainsUrl.searchParams.set("target", domain);
  refDomainsUrl.searchParams.set("target_type", "root_domain");
  refDomainsUrl.searchParams.set("display_limit", "20");
  refDomainsUrl.searchParams.set("display_sort", "backlinks_num");
  refDomainsUrl.searchParams.set("export_columns", "domain_ascore,domain,backlinks_num,first_seen,last_seen");

  const requestInfo: RequestInfo = {
    method: "GET",
    url: ranksUrl.toString(),
    headers: {},
  };

  try {
    console.log("[SEMrush] Fetching comprehensive data for:", domain);

    // Fetch all endpoints in parallel
    const [ranksResponse, backlinksResponse, organicResponse, refDomainsResponse] = await Promise.all([
      fetch(ranksUrl.toString(), { signal: AbortSignal.timeout(15000) }),
      fetch(backlinksUrl.toString(), { signal: AbortSignal.timeout(15000) }).catch(() => null),
      fetch(organicUrl.toString(), { signal: AbortSignal.timeout(15000) }).catch(() => null),
      fetch(refDomainsUrl.toString(), { signal: AbortSignal.timeout(15000) }).catch(() => null),
    ]);

    const ranksText = await ranksResponse.text();
    const backlinksText = backlinksResponse ? await backlinksResponse.text() : null;
    const organicText = organicResponse ? await organicResponse.text() : null;
    const refDomainsText = refDomainsResponse ? await refDomainsResponse.text() : null;

    const rawResponse = {
      statusCode: ranksResponse.status,
      domainRanks: ranksText,
      backlinks: backlinksText,
      organicKeywords: organicText,  // Changed from domainOrganic to match parser
      refDomains: refDomainsText,
      fetchedAt: new Date().toISOString(),
      urls: {
        domainRanks: ranksUrl.toString().replace(apiKey, "***"),
        backlinks: backlinksUrl.toString().replace(apiKey, "***"),
        organicKeywords: organicUrl.toString().replace(apiKey, "***"),
        refDomains: refDomainsUrl.toString().replace(apiKey, "***"),
      },
    };

    // Initialize parsed data structure
    const parsed: SEMrushParsedData = {
      domainRanks: null,
      backlinks: null,
      topKeywords: [],
      refDomains: [],
    };

    // Parse domain ranks
    let organic_keywords = 0;
    let organic_traffic = 0;
    let domain_rank = 0;

    if (!ranksText.startsWith("ERROR") && ranksResponse.ok) {
      const lines = ranksText.trim().split("\n");
      if (lines.length >= 2) {
        // Columns: Db;Dn;Rk;Or;Ot;Oc;Ad;At;Ac
        const values = lines[1].split(";");
        domain_rank = parseInt(values[2]) || 0;
        organic_keywords = parseInt(values[3]) || 0;
        organic_traffic = parseInt(values[4]) || 0;

        parsed.domainRanks = {
          rank: domain_rank,
          organicKeywords: organic_keywords,
          organicTraffic: organic_traffic,
          organicCost: parseFloat(values[5]) || 0,
          adwordsKeywords: parseInt(values[6]) || 0,
          adwordsTraffic: parseInt(values[7]) || 0,
          adwordsCost: parseFloat(values[8]) || 0,
        };
      }
    }

    // Parse backlinks for authority score
    let authority_score = 0;
    let backlinks = 0;

    if (backlinksText && !backlinksText.startsWith("ERROR")) {
      const lines = backlinksText.trim().split("\n");
      if (lines.length >= 2) {
        // Columns: ascore;total;domains_num;urls_num;ips_num;follows_num;nofollows_num
        const values = lines[1].split(";");
        authority_score = parseInt(values[0]) || 0;
        backlinks = parseInt(values[1]) || 0;

        parsed.backlinks = {
          authorityScore: authority_score,
          totalBacklinks: backlinks,
          referringDomains: parseInt(values[2]) || 0,
          referringUrls: parseInt(values[3]) || 0,
          referringIps: parseInt(values[4]) || 0,
          followLinks: parseInt(values[5]) || 0,
          nofollowLinks: parseInt(values[6]) || 0,
        };
      }
    }

    // Parse organic keywords
    if (organicText && !organicText.startsWith("ERROR")) {
      const lines = organicText.trim().split("\n");
      if (lines.length >= 2) {
        // Skip header, parse data rows
        // Columns: Ph;Po;Pp;Nq;Tr;Tc;Ur (Keyword, Position, Previous, Volume, Traffic, Traffic%, URL)
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(";");
          if (values.length >= 7) {
            parsed.topKeywords.push({
              keyword: values[0],
              position: parseInt(values[1]) || 0,
              previousPosition: values[2] ? parseInt(values[2]) : null,
              searchVolume: parseInt(values[3]) || 0,
              traffic: parseFloat(values[4]) || 0,
              trafficPercent: parseFloat(values[5]) || 0,
              cpc: parseFloat(values[6]) || 0,
              url: values[7] || "",
            });
          }
        }
      }
    }

    // Parse referring domains
    if (refDomainsText && !refDomainsText.startsWith("ERROR")) {
      const lines = refDomainsText.trim().split("\n");
      if (lines.length >= 2) {
        // Skip header, parse data rows
        // Columns: domain_ascore;domain;backlinks_num;first_seen;last_seen
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(";");
          if (values.length >= 5) {
            parsed.refDomains.push({
              domain: values[1],
              backlinksCount: parseInt(values[2]) || 0,
              firstSeen: values[3],
              lastSeen: values[4],
            });
          }
        }
      }
    }

    console.log("[SEMrush] Success - Keywords:", organic_keywords, "Traffic:", organic_traffic,
      "Authority:", authority_score, "Backlinks:", backlinks,
      "TopKWs:", parsed.topKeywords.length, "RefDomains:", parsed.refDomains.length);

    return {
      processed: {
        organic_keywords,
        organic_traffic,
        backlinks,
        domain_rank,
        authority_score,
        source: "semrush",
      },
      raw: {
        request: requestInfo,
        response: rawResponse,
        parsed,
      },
    };
  } catch (error) {
    console.error("[SEMrush] Fetch failed:", error);
    return {
      processed: null,
      raw: {
        request: requestInfo,
        response: { error: String(error) },
      },
    };
  }
}

interface PageAnalysis {
  hasSSL: boolean;
  hasMetaDescription: boolean;
  hasMetaTitle: boolean;
  hasMobileViewport: boolean;
  hasBookingCTA: boolean;
  hasPricing: boolean;
  hasReviews: boolean;
  hasContactInfo: boolean;
  hasImages: boolean;
  imageCount: number;
  loadTimeMs: number;
  pageSize: number;
  recommendations: Array<{
    title: string;
    description: string;
    status: "pass" | "fail" | "warning";
    impact: "High" | "Medium" | "Low";
    category: string;
  }>;
}

function analyzePage(
  pageData: Awaited<ReturnType<typeof fetchPage>>,
  _domain: string
): PageAnalysis {
  const { html, loadTimeMs, error } = pageData;
  const lowerHtml = html.toLowerCase();

  const recommendations: PageAnalysis["recommendations"] = [];

  // SSL Check
  const hasSSL = !error && pageData.status === 200;
  recommendations.push({
    title: "SSL Certificate",
    description: hasSSL
      ? "Site uses HTTPS correctly"
      : "Site is not accessible via HTTPS",
    status: hasSSL ? "pass" : "fail",
    impact: "High",
    category: "Security",
  });

  // Meta title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const hasMetaTitle = !!titleMatch && titleMatch[1].trim().length > 0;
  recommendations.push({
    title: "Page Title",
    description: hasMetaTitle
      ? `Found title: "${titleMatch?.[1]?.substring(0, 50)}..."`
      : "Missing or empty page title",
    status: hasMetaTitle ? "pass" : "fail",
    impact: "High",
    category: "SEO",
  });

  // Meta description
  const hasMetaDescription =
    lowerHtml.includes('name="description"') ||
    lowerHtml.includes("name='description'");
  recommendations.push({
    title: "Meta Description",
    description: hasMetaDescription
      ? "Meta description found"
      : "Missing meta description - important for search results",
    status: hasMetaDescription ? "pass" : "fail",
    impact: "High",
    category: "SEO",
  });

  // Mobile viewport
  const hasMobileViewport =
    lowerHtml.includes("viewport") && lowerHtml.includes("width=device-width");
  recommendations.push({
    title: "Mobile Viewport",
    description: hasMobileViewport
      ? "Mobile viewport configured correctly"
      : "Missing mobile viewport meta tag",
    status: hasMobileViewport ? "pass" : "fail",
    impact: "High",
    category: "Performance",
  });

  // Pricing visibility (booking CTA is now in getBookingFlowRecommendations)
  const pricingPatterns = [/\$\d+/, /\d+\s*(per|\/)\s*night/i, /nightly\s*rate/i, /price/i];
  const hasPricing = pricingPatterns.some((p) => p.test(html));
  const bookingKeywords = ["book now", "reserve", "check availability"];
  const hasBookingCTA = bookingKeywords.some((kw) => lowerHtml.includes(kw));
  recommendations.push({
    title: "Pricing Display",
    description: hasPricing
      ? "Pricing information visible"
      : "No pricing found on page - show rates upfront to set expectations",
    status: hasPricing ? "pass" : "warning",
    impact: "High",
    category: "Conversion",
  });

  // Reviews and contact info are now in getTrustSignalRecommendations
  const reviewKeywords = ["review", "testimonial", "guest said", "★", "stars"];
  const hasReviews = reviewKeywords.some((kw) => lowerHtml.includes(kw));
  const contactPatterns = [/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/, /mailto:/i, /@.*\.(com|net|org)/i];
  const hasContactInfo = contactPatterns.some((p) => p.test(html));

  // Image count
  const imageMatches = html.match(/<img[^>]+>/gi) || [];
  const imageCount = imageMatches.length;
  const hasImages = imageCount > 0;
  recommendations.push({
    title: "Property Images",
    description:
      imageCount > 5
        ? `Found ${imageCount} images - good visual content`
        : imageCount > 0
        ? `Only ${imageCount} images - consider adding more property photos`
        : "No images found - property photos are essential",
    status: imageCount > 5 ? "pass" : imageCount > 0 ? "warning" : "fail",
    impact: "High",
    category: "Content",
  });

  // Page load time
  recommendations.push({
    title: "Page Load Time",
    description:
      loadTimeMs < 2000
        ? `Page loaded in ${loadTimeMs}ms - good performance`
        : loadTimeMs < 4000
        ? `Page loaded in ${loadTimeMs}ms - could be faster`
        : `Page loaded in ${loadTimeMs}ms - too slow, optimize images and scripts`,
    status: loadTimeMs < 2000 ? "pass" : loadTimeMs < 4000 ? "warning" : "fail",
    impact: "Medium",
    category: "Performance",
  });

  // Page size
  const pageSize = new Blob([html]).size;
  recommendations.push({
    title: "Page Size",
    description:
      pageSize < 500000
        ? `Page is ${(pageSize / 1024).toFixed(0)}KB - acceptable size`
        : `Page is ${(pageSize / 1024).toFixed(0)}KB - consider reducing page weight`,
    status: pageSize < 500000 ? "pass" : "warning",
    impact: "Medium",
    category: "Performance",
  });

  return {
    hasSSL,
    hasMetaDescription,
    hasMetaTitle,
    hasMobileViewport,
    hasBookingCTA,
    hasPricing,
    hasReviews,
    hasContactInfo,
    hasImages,
    imageCount,
    loadTimeMs,
    pageSize,
    recommendations,
  };
}

function getPageSpeedRecommendations(
  data: PageSpeedResult | null
): PageAnalysis["recommendations"] {
  if (!data?.lighthouseResult) return [];

  const recommendations: PageAnalysis["recommendations"] = [];
  const audits = data.lighthouseResult.audits;
  const categories = data.lighthouseResult.categories;

  if (categories.performance) {
    const score = Math.round(categories.performance.score * 100);
    recommendations.push({
      title: "Lighthouse Performance",
      description:
        score >= 90
          ? `Excellent performance score: ${score}/100`
          : score >= 50
          ? `Performance score ${score}/100 - room for improvement`
          : `Poor performance score ${score}/100 - needs optimization`,
      status: score >= 90 ? "pass" : score >= 50 ? "warning" : "fail",
      impact: "High",
      category: "Performance",
    });
  }

  if (audits["largest-contentful-paint"]) {
    const lcp = audits["largest-contentful-paint"];
    const lcpMs = lcp.numericValue || 0;
    recommendations.push({
      title: "Largest Contentful Paint (LCP)",
      description: lcp.displayValue || `${(lcpMs / 1000).toFixed(1)}s`,
      status: lcpMs <= 2500 ? "pass" : lcpMs <= 4000 ? "warning" : "fail",
      impact: "High",
      category: "Performance",
    });
  }

  if (categories.accessibility) {
    const score = Math.round(categories.accessibility.score * 100);
    recommendations.push({
      title: "Accessibility Score",
      description:
        score >= 90
          ? `Excellent accessibility: ${score}/100`
          : `Accessibility issues found: ${score}/100`,
      status: score >= 90 ? "pass" : score >= 70 ? "warning" : "fail",
      impact: "Medium",
      category: "Trust",
    });
  }

  if (categories.seo) {
    const score = Math.round(categories.seo.score * 100);
    recommendations.push({
      title: "Lighthouse SEO Score",
      description:
        score >= 90
          ? `SEO well-optimized: ${score}/100`
          : `SEO issues to address: ${score}/100`,
      status: score >= 90 ? "pass" : score >= 70 ? "warning" : "fail",
      impact: "High",
      category: "SEO",
    });
  }

  return recommendations;
}

function getSEORecommendations(
  data: SEOMetricsData | null
): PageAnalysis["recommendations"] {
  if (!data) return [];

  const recommendations: PageAnalysis["recommendations"] = [];

  if (data.organic_traffic !== undefined && data.organic_traffic > 0) {
    const traffic = data.organic_traffic;
    recommendations.push({
      title: "Organic Search Traffic",
      description:
        traffic > 1000
          ? `Strong organic presence: ~${traffic.toLocaleString()} monthly visits`
          : traffic > 100
          ? `Moderate organic traffic: ~${traffic.toLocaleString()} monthly visits`
          : `Low organic traffic: ~${traffic} monthly visits - SEO opportunity`,
      status: traffic > 1000 ? "pass" : traffic > 100 ? "warning" : "fail",
      impact: "High",
      category: "SEO",
    });
  }

  if (data.organic_keywords !== undefined && data.organic_keywords > 0) {
    const keywords = data.organic_keywords;
    recommendations.push({
      title: "Ranking Keywords",
      description:
        keywords > 100
          ? `Ranking for ${keywords.toLocaleString()} keywords - good visibility`
          : keywords > 10
          ? `Ranking for ${keywords} keywords - room to expand`
          : `Only ranking for ${keywords} keywords - needs content strategy`,
      status: keywords > 100 ? "pass" : keywords > 10 ? "warning" : "fail",
      impact: "Medium",
      category: "SEO",
    });
  }

  if (data.backlinks !== undefined && data.backlinks > 0) {
    const backlinks = data.backlinks;
    recommendations.push({
      title: "Backlink Profile",
      description:
        backlinks > 1000
          ? `Strong backlink profile: ${backlinks.toLocaleString()} referring domains`
          : backlinks > 100
          ? `Moderate backlinks: ${backlinks.toLocaleString()} referring domains`
          : `Limited backlinks: ${backlinks} - build more links from local tourism sites`,
      status: backlinks > 1000 ? "pass" : backlinks > 100 ? "warning" : "fail",
      impact: "Medium",
      category: "SEO",
    });
  }

  return recommendations;
}

function getBookingFlowRecommendations(
  analysis: BookingFlowAnalysis
): PageAnalysis["recommendations"] {
  const recommendations: PageAnalysis["recommendations"] = [];

  // Booking CTA
  recommendations.push({
    title: "Booking Call-to-Action",
    description: analysis.hasBookingCTA
      ? analysis.ctaLocation === "above-fold"
        ? `"${analysis.ctaText}" button found above the fold`
        : `"${analysis.ctaText}" found, but below the fold - move it higher`
      : "No clear booking CTA found - add prominent booking buttons",
    status: analysis.hasBookingCTA
      ? analysis.ctaLocation === "above-fold"
        ? "pass"
        : "warning"
      : "fail",
    impact: "High",
    category: "Conversion",
  });

  // Booking engine
  if (analysis.bookingEngine) {
    recommendations.push({
      title: "Booking System",
      description:
        analysis.bookingEngine.type === "embedded"
          ? `${analysis.bookingEngine.name} widget detected - keeps guests on your site`
          : `${analysis.bookingEngine.name} detected - redirects guests off your site`,
      status: analysis.bookingEngine.type === "embedded" ? "pass" : "warning",
      impact: "Medium",
      category: "Conversion",
    });
  } else {
    recommendations.push({
      title: "Booking System",
      description: "No booking widget detected - consider adding an integrated booking system",
      status: "fail",
      impact: "High",
      category: "Conversion",
    });
  }

  // Date picker
  recommendations.push({
    title: "Date Selection",
    description: analysis.hasDatePicker
      ? "Date picker found - guests can easily select dates"
      : "No date picker detected - add visible date selection for availability",
    status: analysis.hasDatePicker ? "pass" : "fail",
    impact: "High",
    category: "Conversion",
  });

  // Instant book
  recommendations.push({
    title: "Instant Booking",
    description: analysis.hasInstantBook
      ? "Instant book enabled - reduces booking friction"
      : "No instant booking - inquiry-based bookings have higher abandonment",
    status: analysis.hasInstantBook ? "pass" : "warning",
    impact: "Medium",
    category: "Conversion",
  });

  // Booking friction
  const frictionLevel =
    analysis.frictionScore < 30
      ? "Low"
      : analysis.frictionScore < 60
      ? "Medium"
      : "High";
  recommendations.push({
    title: "Booking Friction",
    description: `${frictionLevel} friction (${analysis.estimatedClicksToBook} estimated clicks to book)${
      analysis.estimatedClicksToBook > 3 ? " - aim for 3 clicks or fewer" : ""
    }`,
    status:
      analysis.frictionScore < 30
        ? "pass"
        : analysis.frictionScore < 60
        ? "warning"
        : "fail",
    impact: "High",
    category: "Conversion",
  });

  return recommendations;
}

function getTrustSignalRecommendations(
  analysis: TrustSignalAnalysis
): PageAnalysis["recommendations"] {
  const recommendations: PageAnalysis["recommendations"] = [];

  // Reviews
  if (analysis.hasReviews) {
    const reviewInfo = analysis.reviewSource
      ? `${analysis.reviewSource.name}${analysis.reviewSource.isVerified ? " (verified)" : ""}`
      : "Site reviews";
    const ratingInfo =
      analysis.averageRating !== null
        ? ` - ${analysis.averageRating}/${analysis.ratingOutOf}`
        : "";
    const countInfo =
      analysis.reviewCount !== null ? ` (${analysis.reviewCount} reviews)` : "";

    recommendations.push({
      title: "Guest Reviews",
      description: `${reviewInfo}${ratingInfo}${countInfo}`,
      status: analysis.reviewSource?.isVerified ? "pass" : "warning",
      impact: "High",
      category: "Trust",
    });
  } else {
    recommendations.push({
      title: "Guest Reviews",
      description: "No reviews found - 93% of travelers read reviews before booking",
      status: "fail",
      impact: "High",
      category: "Trust",
    });
  }

  // Trust badges
  if (analysis.trustBadges.length > 0) {
    const badgeNames = analysis.trustBadges.slice(0, 3).map((b) => b.name).join(", ");
    recommendations.push({
      title: "Trust Badges",
      description: `Found: ${badgeNames}${analysis.trustBadges.length > 3 ? ` (+${analysis.trustBadges.length - 3} more)` : ""}`,
      status: "pass",
      impact: "Medium",
      category: "Trust",
    });
  } else {
    recommendations.push({
      title: "Trust Badges",
      description: "No trust badges found - add Superhost, verified host, or security badges",
      status: "warning",
      impact: "Medium",
      category: "Trust",
    });
  }

  // Contact info
  const contactScore =
    (analysis.hasPhoneNumber ? 1 : 0) +
    (analysis.hasEmailAddress ? 1 : 0) +
    (analysis.hasPhysicalAddress ? 1 : 0);
  const contactDetails = [
    analysis.hasPhoneNumber && "phone",
    analysis.hasEmailAddress && "email",
    analysis.hasPhysicalAddress && "address",
  ].filter(Boolean);

  recommendations.push({
    title: "Contact Information",
    description:
      contactScore >= 2
        ? `Good transparency: ${contactDetails.join(", ")} visible`
        : contactScore === 1
        ? `Limited contact info: only ${contactDetails[0]} found`
        : "No contact info found - guests want to know how to reach you",
    status: contactScore >= 2 ? "pass" : contactScore === 1 ? "warning" : "fail",
    impact: "Medium",
    category: "Trust",
  });

  // Social presence
  const socialCount = analysis.hasSocialProfiles.filter((p) => p.detected).length;
  const detectedPlatforms = analysis.hasSocialProfiles
    .filter((p) => p.detected)
    .map((p) => p.platform)
    .slice(0, 3);

  recommendations.push({
    title: "Social Media Presence",
    description:
      socialCount > 0
        ? `Active on: ${detectedPlatforms.join(", ")}${socialCount > 3 ? ` (+${socialCount - 3} more)` : ""}`
        : "No social media links found - add profiles to show you're a real business",
    status: socialCount >= 2 ? "pass" : socialCount === 1 ? "warning" : "fail",
    impact: "Low",
    category: "Trust",
  });

  // Legal pages
  recommendations.push({
    title: "Privacy Policy",
    description: analysis.hasPrivacyPolicy
      ? "Privacy policy found"
      : "No privacy policy found - legally required and builds trust",
    status: analysis.hasPrivacyPolicy ? "pass" : "fail",
    impact: "Medium",
    category: "Trust",
  });

  // Overall trust score summary
  const trustLevel =
    analysis.overallTrustScore >= 70
      ? "Strong"
      : analysis.overallTrustScore >= 40
      ? "Moderate"
      : "Weak";
  recommendations.push({
    title: "Overall Trust Score",
    description: `${trustLevel} trust signals (${analysis.overallTrustScore}/100)`,
    status:
      analysis.overallTrustScore >= 70
        ? "pass"
        : analysis.overallTrustScore >= 40
        ? "warning"
        : "fail",
    impact: "High",
    category: "Trust",
  });

  return recommendations;
}

function calculateScores(
  analysis: PageAnalysis,
  pageSpeed: PageSpeedResult | null,
  seoData: SEOMetricsData | null,
  bookingFlow: BookingFlowAnalysis,
  trustSignals: TrustSignalAnalysis
) {
  const lighthousePerf = pageSpeed?.lighthouseResult?.categories?.performance?.score;
  const lighthouseSeo = pageSpeed?.lighthouseResult?.categories?.seo?.score;
  const lighthouseAccessibility =
    pageSpeed?.lighthouseResult?.categories?.accessibility?.score;

  // Conversion score - now based on detailed booking flow analysis
  // Inverse friction score (100 - friction = ease of booking)
  const bookingEaseScore = 100 - bookingFlow.frictionScore;
  const conversionFactors = [
    bookingFlow.hasBookingCTA,
    bookingFlow.ctaLocation === "above-fold",
    bookingFlow.bookingEngine !== null,
    bookingFlow.hasDatePicker,
    bookingFlow.hasInstantBook,
    bookingFlow.estimatedClicksToBook <= 3,
    analysis.hasPricing,
  ];
  const conversionCheckScore = calculateCategoryScore(conversionFactors);
  const conversionScore = Math.round((conversionCheckScore + bookingEaseScore) / 2);

  // Performance score
  const basicPerfScore = calculateCategoryScore([
    analysis.hasMobileViewport,
    analysis.loadTimeMs < 3000,
    analysis.pageSize < 500000,
  ]);
  const performanceScore = lighthousePerf
    ? Math.round((basicPerfScore + lighthousePerf * 100) / 2)
    : basicPerfScore;

  // Trust score - now based on detailed trust signal analysis
  const trustScore = trustSignals.overallTrustScore;

  // Content score
  const contentScore = calculateCategoryScore([
    analysis.hasImages,
    analysis.imageCount > 5,
    trustSignals.hasGuestPhotos,
    trustSignals.hasTestimonials,
  ]);

  // SEO score
  const basicSeoScore = calculateCategoryScore([
    analysis.hasMetaTitle,
    analysis.hasMetaDescription,
  ]);
  let seoScore = basicSeoScore;
  if (lighthouseSeo) {
    seoScore = Math.round((seoScore + lighthouseSeo * 100) / 2);
  }
  if (seoData?.organic_traffic) {
    const trafficBonus = Math.min(20, Math.log10(seoData.organic_traffic) * 5);
    seoScore = Math.min(100, seoScore + trafficBonus);
  }

  const securityScore = analysis.hasSSL ? 100 : 0;

  const overall = Math.round(
    conversionScore * 0.35 +
      performanceScore * 0.2 +
      trustScore * 0.2 +
      contentScore * 0.15 +
      seoScore * 0.07 +
      securityScore * 0.03
  );

  return {
    overall,
    categories: [
      {
        name: "Conversion",
        score: conversionScore,
        weight: 35,
        description: "Booking flow and calls-to-action",
        source: bookingFlow.bookingEngine
          ? `Detected: ${bookingFlow.bookingEngine.name}`
          : "HTML analysis",
      },
      {
        name: "Performance",
        score: performanceScore,
        weight: 20,
        description: "Page speed and mobile experience",
        source: lighthousePerf ? "Lighthouse + HTML" : "HTML analysis",
      },
      {
        name: "Trust",
        score: trustScore,
        weight: 20,
        description: "Reviews, ratings, and credibility",
        source: trustSignals.reviewSource
          ? `Reviews: ${trustSignals.reviewSource.name}`
          : "HTML analysis",
      },
      {
        name: "Content",
        score: contentScore,
        weight: 15,
        description: "Images and property descriptions",
      },
      {
        name: "SEO",
        score: seoScore,
        weight: 7,
        description: "Search engine optimization",
        source: seoData?.source ? `Lighthouse + ${seoData.source}` : "HTML analysis",
      },
      {
        name: "Security",
        score: securityScore,
        weight: 3,
        description: "SSL and data protection",
      },
    ],
  };
}

function calculateCategoryScore(checks: boolean[]): number {
  const passed = checks.filter(Boolean).length;
  return Math.round((passed / checks.length) * 100);
}

function estimateRevenueLoss(
  score: number,
  seoData: SEOMetricsData | null
): number {
  const gap = Math.max(0, 90 - score);
  let baseLoss = gap * 50;

  if (seoData?.organic_traffic) {
    const trafficMultiplier = Math.min(3, 1 + seoData.organic_traffic / 1000);
    baseLoss = Math.round(baseLoss * trafficMultiplier);
  }

  return Math.min(baseLoss, 10000);
}

function generateSummary(score: number): string {
  if (score >= 80) {
    return "Your site is performing well, with room for minor improvements.";
  } else if (score >= 60) {
    return "Your site has several issues that may be costing you bookings.";
  } else {
    return "Your site has critical issues that are likely losing you significant revenue.";
  }
}
