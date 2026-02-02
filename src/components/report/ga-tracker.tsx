"use client";

import { useEffect, useRef, useCallback } from "react";
import Script from "next/script";
import {
  getGAMeasurementId,
  trackPageView,
  trackScroll,
  trackCTAClick,
  type ScrollMilestone,
} from "@/lib/ga";

interface GATrackerProps {
  auditId: string;
}

/**
 * Google Analytics Tracker Component
 *
 * This component handles:
 * - Loading the GA4 script
 * - Tracking page views on mount
 * - Tracking scroll milestones (25%, 50%, 75%, 100%)
 * - Providing CTA click tracking via context or direct import
 *
 * Place this component inside the report page layout.
 */
export function GATracker({ auditId }: GATrackerProps) {
  const measurementId = getGAMeasurementId();
  const scrollMilestonesReached = useRef<Set<ScrollMilestone>>(new Set());
  const hasTrackedPageView = useRef(false);

  // Track page view on mount (after GA loads)
  const handleGALoad = useCallback(() => {
    if (!hasTrackedPageView.current) {
      trackPageView(auditId);
      hasTrackedPageView.current = true;
    }
  }, [auditId]);

  // Set up scroll tracking with IntersectionObserver
  useEffect(() => {
    if (!measurementId) return;

    // Create milestone markers at different scroll depths
    const milestones: ScrollMilestone[] = [25, 50, 75, 100];

    // Function to check scroll percentage
    const checkScrollMilestones = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;

      // Calculate scroll percentage
      const scrollableHeight = scrollHeight - clientHeight;
      if (scrollableHeight <= 0) return;

      const scrollPercent = (scrollTop / scrollableHeight) * 100;

      // Check each milestone
      milestones.forEach((milestone) => {
        if (
          scrollPercent >= milestone &&
          !scrollMilestonesReached.current.has(milestone)
        ) {
          scrollMilestonesReached.current.add(milestone);
          trackScroll(auditId, milestone);
        }
      });
    };

    // Throttle scroll events for performance
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          checkScrollMilestones();
          ticking = false;
        });
        ticking = true;
      }
    };

    // Add scroll listener
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Check initial scroll position (in case user refreshes mid-page)
    checkScrollMilestones();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [auditId, measurementId]);

  // Don't render anything if GA is not configured
  if (!measurementId) {
    return null;
  }

  return (
    <>
      {/* GA4 Script */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
        onLoad={handleGALoad}
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            page_path: window.location.pathname,
            cookie_flags: 'SameSite=None;Secure'
          });
        `}
      </Script>
    </>
  );
}

/**
 * Hook to get a CTA click handler for a specific audit
 *
 * Usage:
 * const handleCTAClick = useCTATracking(auditId);
 * <a onClick={() => handleCTAClick('get_started', 'sticky_footer')} href="...">
 */
export function useCTATracking(auditId: string) {
  return useCallback(
    (ctaType: string, ctaLocation: string) => {
      trackCTAClick(auditId, ctaType, ctaLocation);
    },
    [auditId]
  );
}
