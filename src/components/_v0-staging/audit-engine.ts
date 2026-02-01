import type {
  AuditResult,
  AuditCategory,
  AuditIssue,
  QuickWin,
  AuditMetadata,
  PerformanceData,
  SEOData,
  TrustData,
  MobileData,
  ConversionData,
} from "./audit-types"

// Generate unique ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
}

// Simulated performance check (would integrate with PageSpeed API)
async function checkPerformance(url: string): Promise<PerformanceData> {
  await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))
  
  const score = Math.floor(Math.random() * 40) + 40 // 40-80 range for realistic scores
  const issues: AuditIssue[] = []

  if (score < 50) {
    issues.push({
      id: generateId(),
      category: "performance",
      severity: "critical",
      title: "Slow page load time",
      description: "Your page takes longer than 3 seconds to load, which causes 40% of visitors to leave.",
      impact: "Guests abandon slow sites. Every second of delay reduces conversions by 7%.",
      howToFix: "Compress images, enable browser caching, minimize JavaScript, and consider a CDN.",
    })
  }

  if (Math.random() > 0.5) {
    issues.push({
      id: generateId(),
      category: "performance",
      severity: "warning",
      title: "Large Contentful Paint (LCP) needs improvement",
      description: "The largest content element takes too long to render.",
      impact: "Poor LCP affects search rankings and user perception of speed.",
      howToFix: "Optimize hero images, preload critical resources, and reduce server response time.",
    })
  }

  if (Math.random() > 0.6) {
    issues.push({
      id: generateId(),
      category: "performance",
      severity: "warning",
      title: "Unoptimized images detected",
      description: "Several images on your site are not compressed or properly sized.",
      impact: "Large images slow down your site, especially on mobile connections.",
      howToFix: "Use modern formats like WebP, implement lazy loading, and serve responsive images.",
    })
  }

  return {
    score,
    metrics: {
      lcp: 1500 + Math.random() * 3000,
      fid: 50 + Math.random() * 200,
      cls: Math.random() * 0.3,
      ttfb: 200 + Math.random() * 800,
      fcp: 1000 + Math.random() * 2000,
    },
    issues,
  }
}

// Simulated SEO check
async function checkSEO(url: string): Promise<SEOData> {
  await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 1500))
  
  const hasTitle = Math.random() > 0.2
  const hasDescription = Math.random() > 0.3
  const hasH1 = Math.random() > 0.25
  const hasCanonical = Math.random() > 0.5
  const hasStructuredData = Math.random() > 0.6

  const issues: AuditIssue[] = []
  let score = 100

  if (!hasTitle) {
    score -= 25
    issues.push({
      id: generateId(),
      category: "seo",
      severity: "critical",
      title: "Missing or inadequate page title",
      description: "Your page title is missing or doesn't include relevant STR keywords.",
      impact: "Page titles are crucial for search visibility. Without a good title, you're invisible to travelers searching for rentals.",
      howToFix: "Add a descriptive title with location, property type, and unique features (e.g., 'Oceanfront 3BR Villa in Miami | Private Pool').",
    })
  }

  if (!hasDescription) {
    score -= 20
    issues.push({
      id: generateId(),
      category: "seo",
      severity: "critical",
      title: "Missing meta description",
      description: "No meta description found for your property page.",
      impact: "Meta descriptions appear in search results and influence click-through rates.",
      howToFix: "Add a compelling 150-160 character description highlighting your property's best features and amenities.",
    })
  }

  if (!hasH1) {
    score -= 15
    issues.push({
      id: generateId(),
      category: "seo",
      severity: "warning",
      title: "Missing H1 heading",
      description: "Your page lacks a primary H1 heading.",
      impact: "H1 tags help search engines understand your page content.",
      howToFix: "Add a clear H1 heading that describes your property.",
    })
  }

  if (!hasStructuredData) {
    score -= 20
    issues.push({
      id: generateId(),
      category: "seo",
      severity: "warning",
      title: "No vacation rental schema markup",
      description: "Missing structured data for vacation rental or lodging business.",
      impact: "Schema markup helps search engines display rich results with ratings, prices, and availability.",
      howToFix: "Implement LodgingBusiness or VacationRental schema with pricing, reviews, and amenities.",
    })
  }

  return {
    score: Math.max(0, score),
    hasTitle,
    hasDescription,
    hasH1,
    hasCanonical,
    hasStructuredData,
    issues,
  }
}

// Simulated trust signals check
async function checkTrust(url: string): Promise<TrustData> {
  await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 1200))
  
  const hasSSL = Math.random() > 0.1
  const hasReviews = Math.random() > 0.4
  const hasContactInfo = Math.random() > 0.3
  const hasSocialProof = Math.random() > 0.5

  const issues: AuditIssue[] = []
  let score = 100

  if (!hasSSL) {
    score -= 40
    issues.push({
      id: generateId(),
      category: "trust",
      severity: "critical",
      title: "SSL certificate missing or invalid",
      description: "Your site is not secure (no HTTPS).",
      impact: "Browsers mark non-HTTPS sites as 'Not Secure'. Guests won't enter payment info on insecure sites.",
      howToFix: "Install an SSL certificate. Most hosts offer free SSL through Let's Encrypt.",
    })
  }

  if (!hasReviews) {
    score -= 25
    issues.push({
      id: generateId(),
      category: "trust",
      severity: "warning",
      title: "No visible guest reviews",
      description: "Your site doesn't display guest reviews or testimonials.",
      impact: "92% of travelers read reviews before booking. Missing reviews significantly reduce trust.",
      howToFix: "Add a reviews section featuring guest testimonials, or integrate reviews from Airbnb/VRBO/Google.",
    })
  }

  if (!hasContactInfo) {
    score -= 20
    issues.push({
      id: generateId(),
      category: "trust",
      severity: "warning",
      title: "Contact information not visible",
      description: "No phone number, email, or contact form easily found.",
      impact: "Guests want assurance they can reach you. Hidden contact info raises scam concerns.",
      howToFix: "Add visible contact information in your header or footer. Include phone, email, and a contact form.",
    })
  }

  if (!hasSocialProof) {
    score -= 15
    issues.push({
      id: generateId(),
      category: "trust",
      severity: "info",
      title: "Limited social proof elements",
      description: "Missing trust badges, awards, or association memberships.",
      impact: "Trust badges and credentials reassure first-time guests.",
      howToFix: "Add relevant badges (Superhost, VRMA member, etc.) and display booking platform logos.",
    })
  }

  return {
    score: Math.max(0, score),
    hasSSL,
    hasReviews,
    hasContactInfo,
    hasSocialProof,
    issues,
  }
}

// Simulated mobile check
async function checkMobile(url: string): Promise<MobileData> {
  await new Promise((resolve) => setTimeout(resolve, 700 + Math.random() * 1300))
  
  const isResponsive = Math.random() > 0.3
  const hasTouchTargets = Math.random() > 0.4
  const hasViewport = Math.random() > 0.2

  const issues: AuditIssue[] = []
  let score = 100

  if (!isResponsive) {
    score -= 40
    issues.push({
      id: generateId(),
      category: "mobile",
      severity: "critical",
      title: "Site not mobile-responsive",
      description: "Your website doesn't adapt properly to mobile screens.",
      impact: "Over 60% of travel bookings start on mobile. Non-responsive sites lose the majority of potential guests.",
      howToFix: "Implement responsive design with flexible layouts, readable fonts, and tap-friendly buttons.",
    })
  }

  if (!hasTouchTargets) {
    score -= 25
    issues.push({
      id: generateId(),
      category: "mobile",
      severity: "warning",
      title: "Touch targets too small",
      description: "Buttons and links are too small or too close together for mobile users.",
      impact: "Small touch targets cause frustration and mis-taps, especially when booking.",
      howToFix: "Ensure touch targets are at least 44x44 pixels with adequate spacing.",
    })
  }

  if (!hasViewport) {
    score -= 20
    issues.push({
      id: generateId(),
      category: "mobile",
      severity: "warning",
      title: "Missing viewport meta tag",
      description: "No viewport configuration found.",
      impact: "Without proper viewport settings, your site won't scale correctly on mobile devices.",
      howToFix: "Add: <meta name='viewport' content='width=device-width, initial-scale=1'>",
    })
  }

  return {
    score: Math.max(0, score),
    isResponsive,
    hasTouchTargets,
    hasViewport,
    issues,
  }
}

// Simulated conversion check (STR-specific)
async function checkConversion(url: string): Promise<ConversionData> {
  await new Promise((resolve) => setTimeout(resolve, 900 + Math.random() * 1600))
  
  const hasBookingCTA = Math.random() > 0.35
  const hasPricing = Math.random() > 0.4
  const hasAvailability = Math.random() > 0.5
  const hasGallery = Math.random() > 0.25

  const issues: AuditIssue[] = []
  let score = 100

  if (!hasBookingCTA) {
    score -= 35
    issues.push({
      id: generateId(),
      category: "conversion",
      severity: "critical",
      title: "No clear booking call-to-action",
      description: "Your booking button is missing, unclear, or not prominently placed.",
      impact: "This is the #1 conversion killer. If guests can't easily find how to book, they'll go elsewhere.",
      howToFix: "Add a prominent 'Book Now' or 'Check Availability' button above the fold on every page.",
    })
  }

  if (!hasPricing) {
    score -= 25
    issues.push({
      id: generateId(),
      category: "conversion",
      severity: "warning",
      title: "Pricing not clearly displayed",
      description: "Nightly rates or pricing information is hard to find.",
      impact: "Guests want to know costs upfront. Hidden pricing creates friction and distrust.",
      howToFix: "Display starting rates clearly. Show pricing breakdowns including fees before the booking step.",
    })
  }

  if (!hasAvailability) {
    score -= 20
    issues.push({
      id: generateId(),
      category: "conversion",
      severity: "warning",
      title: "No availability calendar visible",
      description: "Guests can't see when your property is available.",
      impact: "Availability calendars reduce inquiry friction and help guests plan their trip.",
      howToFix: "Add an interactive availability calendar that shows open dates clearly.",
    })
  }

  if (!hasGallery) {
    score -= 15
    issues.push({
      id: generateId(),
      category: "conversion",
      severity: "warning",
      title: "Photo gallery needs improvement",
      description: "Property photos are limited, low quality, or poorly organized.",
      impact: "Photos are the #1 factor in booking decisions. Poor photos = poor bookings.",
      howToFix: "Add professional photos of all rooms, amenities, views, and nearby attractions.",
    })
  }

  return {
    score: Math.max(0, score),
    hasBookingCTA,
    hasPricing,
    hasAvailability,
    hasGallery,
    issues,
  }
}

// Main audit function with parallel execution
export async function runAudit(domain: string): Promise<AuditResult> {
  const url = `https://${domain}`
  
  // Run all checks in parallel
  const [performance, seo, trust, mobile, conversion] = await Promise.allSettled([
    checkPerformance(url),
    checkSEO(url),
    checkTrust(url),
    checkMobile(url),
    checkConversion(url),
  ])

  // Extract results with fallbacks for failed checks
  const perfData = performance.status === "fulfilled" ? performance.value : null
  const seoData = seo.status === "fulfilled" ? seo.value : null
  const trustData = trust.status === "fulfilled" ? trust.value : null
  const mobileData = mobile.status === "fulfilled" ? mobile.value : null
  const convData = conversion.status === "fulfilled" ? conversion.value : null

  // Collect all issues
  const allIssues: AuditIssue[] = [
    ...(perfData?.issues || []),
    ...(seoData?.issues || []),
    ...(trustData?.issues || []),
    ...(mobileData?.issues || []),
    ...(convData?.issues || []),
  ]

  // Build categories
  const categories: AuditCategory[] = [
    {
      id: "performance",
      name: "Performance",
      score: perfData?.score ?? 50,
      maxScore: 100,
      status: getStatus(perfData?.score ?? 50),
      description: "Page speed and loading performance",
      issueCount: perfData?.issues.length ?? 0,
    },
    {
      id: "seo",
      name: "SEO",
      score: seoData?.score ?? 50,
      maxScore: 100,
      status: getStatus(seoData?.score ?? 50),
      description: "Search engine optimization",
      issueCount: seoData?.issues.length ?? 0,
    },
    {
      id: "trust",
      name: "Trust & Security",
      score: trustData?.score ?? 50,
      maxScore: 100,
      status: getStatus(trustData?.score ?? 50),
      description: "Trust signals and security",
      issueCount: trustData?.issues.length ?? 0,
    },
    {
      id: "mobile",
      name: "Mobile Experience",
      score: mobileData?.score ?? 50,
      maxScore: 100,
      status: getStatus(mobileData?.score ?? 50),
      description: "Mobile responsiveness and usability",
      issueCount: mobileData?.issues.length ?? 0,
    },
    {
      id: "conversion",
      name: "Conversion",
      score: convData?.score ?? 50,
      maxScore: 100,
      status: getStatus(convData?.score ?? 50),
      description: "Booking conversion optimization",
      issueCount: convData?.issues.length ?? 0,
    },
  ]

  // Calculate overall score (weighted average favoring conversion and trust for STR)
  const weights = { performance: 0.15, seo: 0.2, trust: 0.25, mobile: 0.15, conversion: 0.25 }
  const overallScore = Math.round(
    (perfData?.score ?? 50) * weights.performance +
    (seoData?.score ?? 50) * weights.seo +
    (trustData?.score ?? 50) * weights.trust +
    (mobileData?.score ?? 50) * weights.mobile +
    (convData?.score ?? 50) * weights.conversion
  )

  // Generate quick wins (high impact, low effort fixes)
  const quickWins = generateQuickWins(allIssues)

  // Build metadata
  const metadata: AuditMetadata = {
    url,
    title: `Property at ${domain}`,
    loadTime: perfData?.metrics.lcp,
    mobileScore: mobileData?.score,
    desktopScore: perfData?.score,
    sslValid: trustData?.hasSSL,
    hasBookingCTA: convData?.hasBookingCTA,
    hasReviews: trustData?.hasReviews,
  }

  const now = new Date()
  const expiresAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) // 14 days

  return {
    id: generateId(),
    domain,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    overallScore,
    categories,
    quickWins,
    issues: allIssues,
    metadata,
  }
}

function getStatus(score: number): "good" | "warning" | "critical" {
  if (score >= 80) return "good"
  if (score >= 50) return "warning"
  return "critical"
}

function generateQuickWins(issues: AuditIssue[]): QuickWin[] {
  const quickWins: QuickWin[] = []
  
  // Find critical issues that are typically easy to fix
  const criticalIssues = issues.filter((i) => i.severity === "critical")
  
  for (const issue of criticalIssues.slice(0, 3)) {
    quickWins.push({
      id: generateId(),
      title: issue.title,
      description: issue.howToFix,
      impact: "high",
      effort: getEffortFromIssue(issue),
      category: issue.category,
    })
  }

  // Add some warning-level quick wins
  const warningIssues = issues.filter((i) => i.severity === "warning")
  for (const issue of warningIssues.slice(0, 2)) {
    if (quickWins.length < 5) {
      quickWins.push({
        id: generateId(),
        title: issue.title,
        description: issue.howToFix,
        impact: "medium",
        effort: getEffortFromIssue(issue),
        category: issue.category,
      })
    }
  }

  return quickWins
}

function getEffortFromIssue(issue: AuditIssue): "low" | "medium" | "high" {
  // Simple heuristic based on issue type
  const lowEffortKeywords = ["meta", "title", "description", "ssl", "viewport", "badge"]
  const highEffortKeywords = ["responsive", "redesign", "schema", "calendar"]
  
  const text = (issue.title + issue.howToFix).toLowerCase()
  
  if (lowEffortKeywords.some((k) => text.includes(k))) return "low"
  if (highEffortKeywords.some((k) => text.includes(k))) return "high"
  return "medium"
}
