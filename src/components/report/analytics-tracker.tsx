"use client";

import { useEffect, useRef, useCallback } from "react";

// Cookie name and expiry for visitor ID
const VISITOR_ID_COOKIE = "ghai_vid";
const VISITOR_ID_EXPIRY_DAYS = 30;

interface AnalyticsTrackerProps {
  auditId: string;
}

/**
 * Built-in Analytics Tracker Component
 *
 * This component handles:
 * - Generating/persisting visitor ID in a first-party cookie (30-day expiry)
 * - Generating a session ID per page load
 * - Firing a view event on mount
 * - Tracking scroll depth
 * - Beaconing time-on-page via visibilitychange event
 *
 * This is ADDITIONAL tracking to GA - it stores data in our own database.
 */
export function AnalyticsTracker({ auditId }: AnalyticsTrackerProps) {
  const viewIdRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string>(generateSessionId());
  const startTimeRef = useRef<number>(Date.now());
  const maxScrollRef = useRef<number>(0);
  const hasTrackedViewRef = useRef(false);

  // Get or create visitor ID
  const getVisitorId = useCallback((): string => {
    let visitorId = getCookie(VISITOR_ID_COOKIE);
    if (!visitorId) {
      visitorId = generateVisitorId();
      setCookie(VISITOR_ID_COOKIE, visitorId, VISITOR_ID_EXPIRY_DAYS);
    }
    return visitorId;
  }, []);

  // Get device info
  const getDeviceInfo = useCallback(() => {
    const ua = navigator.userAgent;

    // Simple device type detection
    let deviceType = "desktop";
    if (/Mobi|Android/i.test(ua)) {
      deviceType = /Tablet|iPad/i.test(ua) ? "tablet" : "mobile";
    }

    // Browser detection
    let browser = "unknown";
    if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Edg")) browser = "Edge";
    else if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Safari")) browser = "Safari";

    // OS detection
    let os = "unknown";
    if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Mac")) os = "macOS";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iOS") || ua.includes("iPhone") || ua.includes("iPad"))
      os = "iOS";

    return { deviceType, browser, os };
  }, []);

  // Get UTM params from URL
  const getUtmParams = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      utmSource: params.get("utm_source") || undefined,
      utmMedium: params.get("utm_medium") || undefined,
      utmCampaign: params.get("utm_campaign") || undefined,
    };
  }, []);

  // Track view on mount
  useEffect(() => {
    if (hasTrackedViewRef.current) return;
    hasTrackedViewRef.current = true;

    const visitorId = getVisitorId();
    const sessionId = sessionIdRef.current;
    const deviceInfo = getDeviceInfo();
    const utmParams = getUtmParams();

    // Fire view event
    fetch("/api/analytics/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auditId,
        visitorId,
        sessionId,
        referrer: document.referrer || undefined,
        ...utmParams,
        ...deviceInfo,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.viewId) {
          viewIdRef.current = data.viewId;
        }
      })
      .catch((err) => {
        console.warn("[Analytics] Failed to record view:", err);
      });
  }, [auditId, getVisitorId, getDeviceInfo, getUtmParams]);

  // Track scroll depth
  useEffect(() => {
    const checkScrollDepth = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;

      const scrollableHeight = scrollHeight - clientHeight;
      if (scrollableHeight <= 0) {
        maxScrollRef.current = 100;
        return;
      }

      const scrollPercent = Math.min(
        100,
        Math.round((scrollTop / scrollableHeight) * 100)
      );
      maxScrollRef.current = Math.max(maxScrollRef.current, scrollPercent);
    };

    // Throttle scroll events
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          checkScrollDepth();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    checkScrollDepth(); // Check initial position

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Beacon engagement on visibility change (tab hidden/closed)
  useEffect(() => {
    const sendEngagement = () => {
      if (!viewIdRef.current) return;

      const timeOnPage = Date.now() - startTimeRef.current;
      const maxScroll = maxScrollRef.current;

      // Use sendBeacon for reliability on page unload
      const payload = JSON.stringify({
        viewId: viewIdRef.current,
        timeOnPageMs: timeOnPage,
        maxScrollPercent: maxScroll,
      });

      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/analytics/engagement", payload);
      } else {
        // Fallback for older browsers
        fetch("/api/analytics/engagement", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {
          // Ignore errors on unload
        });
      }
    };

    // Send on visibility change (tab hidden)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        sendEngagement();
      }
    };

    // Send on page unload (closing tab/window)
    const handleBeforeUnload = () => {
      sendEngagement();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Send final engagement on unmount
      sendEngagement();
    };
  }, []);

  // This component renders nothing - it's purely for tracking
  return null;
}

/**
 * Hook to track CTA clicks in built-in analytics
 *
 * Usage:
 * const trackClick = useAnalyticsClick(auditId);
 * <button onClick={() => trackClick('get_started', 'sticky_footer')}>
 */
export function useAnalyticsClick(auditId: string) {
  const getVisitorId = useCallback((): string => {
    return getCookie(VISITOR_ID_COOKIE) || generateVisitorId();
  }, []);

  return useCallback(
    (ctaType: string, ctaLocation?: string) => {
      const visitorId = getVisitorId();
      // Generate a new session ID or use existing - for clicks we just need consistency
      const sessionId = `s_${Date.now().toString(36)}`;

      fetch("/api/analytics/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auditId,
          visitorId,
          sessionId,
          ctaType,
          ctaLocation,
        }),
      }).catch((err) => {
        console.warn("[Analytics] Failed to record click:", err);
      });
    },
    [auditId, getVisitorId]
  );
}

// -----------------------------------------------------------------------------
// Utility Functions
// -----------------------------------------------------------------------------

function generateVisitorId(): string {
  return `v_${randomId(16)}`;
}

function generateSessionId(): string {
  return `s_${randomId(16)}`;
}

function randomId(length: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

// -----------------------------------------------------------------------------
// Cookie Helpers (native browser API)
// -----------------------------------------------------------------------------

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days: number): void {
  if (typeof document === "undefined") return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  const secure = window.location.protocol === "https:" ? ";Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax${secure}`;
}
