/**
 * Google Analytics 4 Integration for GetHost.AI
 *
 * This module provides typed event functions for tracking user interactions
 * on report pages. Only fires events if NEXT_PUBLIC_GA_MEASUREMENT_ID is set.
 */

// Type for scroll milestone percentages
export type ScrollMilestone = 25 | 50 | 75 | 100;

// Type for GA4 window interface
declare global {
  interface Window {
    gtag?: (
      command: "config" | "event" | "js",
      targetId: string,
      params?: Record<string, unknown>
    ) => void;
    dataLayer?: unknown[];
  }
}

/**
 * Check if GA is configured and available
 */
function isGAAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    !!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID &&
    typeof window.gtag === "function"
  );
}

/**
 * Get the GA Measurement ID from environment
 */
export function getGAMeasurementId(): string | undefined {
  return process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
}

/**
 * Track a page view event for a report
 *
 * @param auditId - The unique identifier for the audit report
 */
export function trackPageView(auditId: string): void {
  if (!isGAAvailable()) return;

  window.gtag?.("event", "report_view", {
    audit_id: auditId,
    page_type: "report",
  });
}

/**
 * Track scroll milestone events
 *
 * @param auditId - The unique identifier for the audit report
 * @param percent - The scroll milestone (25, 50, 75, or 100)
 */
export function trackScroll(auditId: string, percent: ScrollMilestone): void {
  if (!isGAAvailable()) return;

  window.gtag?.("event", `report_scroll_${percent}`, {
    audit_id: auditId,
    scroll_depth: percent,
  });
}

/**
 * Track CTA click events
 *
 * @param auditId - The unique identifier for the audit report
 * @param ctaType - The type of CTA (e.g., 'get_started', 'contact', 'new_audit')
 * @param ctaLocation - Where the CTA is located (e.g., 'sticky_footer', 'hero', 'inline')
 */
export function trackCTAClick(
  auditId: string,
  ctaType: string,
  ctaLocation: string
): void {
  if (!isGAAvailable()) return;

  window.gtag?.("event", "cta_click", {
    audit_id: auditId,
    cta_type: ctaType,
    cta_location: ctaLocation,
  });
}

/**
 * Track lead capture events (email submission)
 *
 * @param auditId - The unique identifier for the audit report
 */
export function trackLeadCapture(auditId: string): void {
  if (!isGAAvailable()) return;

  window.gtag?.("event", "lead_capture", {
    audit_id: auditId,
  });

  // Also fire as a conversion event for Google Ads if configured
  const conversionId = process.env.NEXT_PUBLIC_GA_CONVERSION_LEAD_CAPTURE;
  if (conversionId) {
    window.gtag?.("event", "conversion", {
      send_to: conversionId,
    });
  }
}
