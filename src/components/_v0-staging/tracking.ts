export interface TrackingEvent {
  eventType: "report_open" | "cta_click" | "pdf_download" | "share"
  reportId: string
  domain: string
  utm_source?: string | null
  utm_campaign?: string | null
  utm_medium?: string | null
  ctaType?: string
  timestamp: string
  userAgent?: string
  referrer?: string
}

// Track an event (would send to analytics backend in production)
export function trackEvent(event: Omit<TrackingEvent, "timestamp" | "userAgent" | "referrer">) {
  const fullEvent: TrackingEvent = {
    ...event,
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== "undefined" ? window.navigator.userAgent : undefined,
    referrer: typeof document !== "undefined" ? document.referrer : undefined,
  }

  // Log to console in development
  console.log("[v0] Tracking event:", fullEvent)

  // Send to tracking API
  if (typeof window !== "undefined") {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fullEvent),
    }).catch(console.error)
  }

  return fullEvent
}

// Track report open
export function trackReportOpen(reportId: string, domain: string, utmParams?: { 
  source?: string | null
  campaign?: string | null 
  medium?: string | null 
}) {
  return trackEvent({
    eventType: "report_open",
    reportId,
    domain,
    utm_source: utmParams?.source,
    utm_campaign: utmParams?.campaign,
    utm_medium: utmParams?.medium,
  })
}

// Track CTA click
export function trackCTAClick(reportId: string, domain: string, ctaType: string, utmParams?: {
  source?: string | null
  campaign?: string | null
  medium?: string | null
}) {
  return trackEvent({
    eventType: "cta_click",
    reportId,
    domain,
    ctaType,
    utm_source: utmParams?.source,
    utm_campaign: utmParams?.campaign,
    utm_medium: utmParams?.medium,
  })
}

// Get UTM parameters from URL
export function getUTMParams(): Record<string, string | null> {
  if (typeof window === "undefined") return {}
  
  const params = new URLSearchParams(window.location.search)
  return {
    utm_source: params.get("utm_source"),
    utm_campaign: params.get("utm_campaign"),
    utm_medium: params.get("utm_medium"),
    utm_content: params.get("utm_content"),
    utm_term: params.get("utm_term"),
  }
}

// Build EliteGen URL with attribution
export function buildEliteGenURL(path: string, params: Record<string, string | undefined>) {
  const baseURL = "https://elitegen.com"
  const url = new URL(path, baseURL)
  
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      url.searchParams.set(key, value)
    }
  }
  
  // Add referral source
  url.searchParams.set("ref", "web-audit")
  
  return url.toString()
}
