/**
 * Built-in Analytics for GetHost.AI
 *
 * This module provides server-side analytics tracking, independent of GA.
 * Tracks views, engagement (time on page, scroll depth), and CTA clicks.
 */

import { getDb } from "./db";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface ViewData {
  auditId: string;
  visitorId: string;
  sessionId: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  country?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
}

export interface EngagementData {
  viewId: string;
  timeOnPageMs: number;
  maxScrollPercent: number;
}

export interface ClickData {
  auditId: string;
  visitorId: string;
  sessionId: string;
  ctaType: string;
  ctaLocation?: string;
}

export interface ReportStats {
  totalViews: number;
  uniqueVisitors: number;
  avgTimeOnPageMs: number;
  avgScrollPercent: number;
  ctaClicks: number;
  clicksByType: Record<string, number>;
}

// -----------------------------------------------------------------------------
// ID Generators
// -----------------------------------------------------------------------------

/**
 * Generate a unique visitor ID
 * Uses crypto.randomUUID for uniqueness
 */
export function generateVisitorId(): string {
  // Use a prefix for easy identification
  return `v_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

/**
 * Generate a unique session ID
 * Sessions are per-page-load
 */
export function generateSessionId(): string {
  return `s_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

/**
 * Generate a unique view ID
 */
function generateViewId(): string {
  return `view_${Date.now()}_${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
}

/**
 * Generate a unique click ID
 */
function generateClickId(): string {
  return `click_${Date.now()}_${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
}

// -----------------------------------------------------------------------------
// Analytics Functions
// -----------------------------------------------------------------------------

/**
 * Record a new view event
 * @returns The view ID for subsequent engagement updates
 */
export async function recordView(data: ViewData): Promise<string> {
  const db = await getDb();
  const viewId = generateViewId();
  const now = new Date().toISOString();

  await db.execute({
    sql: `
      INSERT INTO report_views (
        id, audit_id, visitor_id, session_id, viewed_at,
        referrer, utm_source, utm_medium, utm_campaign,
        country, device_type, browser, os, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      viewId,
      data.auditId,
      data.visitorId,
      data.sessionId,
      now,
      data.referrer || null,
      data.utmSource || null,
      data.utmMedium || null,
      data.utmCampaign || null,
      data.country || null,
      data.deviceType || null,
      data.browser || null,
      data.os || null,
      now,
    ],
  });

  return viewId;
}

/**
 * Update engagement metrics for an existing view
 * Uses upsert-like logic: only updates if new values are higher
 */
export async function updateEngagement(data: EngagementData): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();

  // Update time and scroll, but only if new values are higher
  // This handles multiple beacon calls gracefully
  await db.execute({
    sql: `
      UPDATE report_views
      SET
        time_on_page_ms = CASE
          WHEN time_on_page_ms IS NULL OR ? > time_on_page_ms THEN ?
          ELSE time_on_page_ms
        END,
        max_scroll_percent = CASE
          WHEN max_scroll_percent IS NULL OR ? > max_scroll_percent THEN ?
          ELSE max_scroll_percent
        END,
        updated_at = ?
      WHERE id = ?
    `,
    args: [
      data.timeOnPageMs,
      data.timeOnPageMs,
      data.maxScrollPercent,
      data.maxScrollPercent,
      now,
      data.viewId,
    ],
  });
}

/**
 * Record a CTA click event
 */
export async function recordClick(data: ClickData): Promise<string> {
  const db = await getDb();
  const clickId = generateClickId();
  const now = new Date().toISOString();

  await db.execute({
    sql: `
      INSERT INTO report_clicks (
        id, audit_id, visitor_id, session_id, clicked_at, cta_type, cta_location
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      clickId,
      data.auditId,
      data.visitorId,
      data.sessionId,
      now,
      data.ctaType,
      data.ctaLocation || null,
    ],
  });

  return clickId;
}

/**
 * Get analytics stats for a specific report
 */
export async function getReportStats(auditId: string): Promise<ReportStats> {
  const db = await getDb();

  // Get view stats
  const viewStats = await db.execute({
    sql: `
      SELECT
        COUNT(*) as total_views,
        COUNT(DISTINCT visitor_id) as unique_visitors,
        AVG(COALESCE(time_on_page_ms, 0)) as avg_time,
        AVG(COALESCE(max_scroll_percent, 0)) as avg_scroll
      FROM report_views
      WHERE audit_id = ?
    `,
    args: [auditId],
  });

  // Get click stats
  const clickStats = await db.execute({
    sql: `
      SELECT
        COUNT(*) as total_clicks,
        cta_type,
        COUNT(*) as type_count
      FROM report_clicks
      WHERE audit_id = ?
      GROUP BY cta_type
    `,
    args: [auditId],
  });

  const row = viewStats.rows[0] || {};
  const clicksByType: Record<string, number> = {};
  let totalClicks = 0;

  for (const clickRow of clickStats.rows) {
    const ctaType = clickRow.cta_type as string;
    const count = clickRow.type_count as number;
    clicksByType[ctaType] = count;
    totalClicks += count;
  }

  return {
    totalViews: (row.total_views as number) || 0,
    uniqueVisitors: (row.unique_visitors as number) || 0,
    avgTimeOnPageMs: Math.round((row.avg_time as number) || 0),
    avgScrollPercent: Math.round((row.avg_scroll as number) || 0),
    ctaClicks: totalClicks,
    clicksByType,
  };
}

/**
 * Get aggregated dashboard stats
 * @param period - Time period to aggregate ('24h', '7d', '30d')
 */
export async function getDashboardStats(
  period: "24h" | "7d" | "30d" = "7d"
): Promise<{
  totalViews: number;
  uniqueVisitors: number;
  avgTimeOnPageMs: number;
  avgScrollPercent: number;
  totalClicks: number;
  topReports: Array<{ auditId: string; views: number }>;
  geoBreakdown: Record<string, number>;
}> {
  const db = await getDb();

  // Calculate the date threshold
  const periodDays = period === "24h" ? 1 : period === "7d" ? 7 : 30;
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - periodDays);
  const thresholdStr = threshold.toISOString();

  // Get overall view stats
  const viewStats = await db.execute({
    sql: `
      SELECT
        COUNT(*) as total_views,
        COUNT(DISTINCT visitor_id) as unique_visitors,
        AVG(COALESCE(time_on_page_ms, 0)) as avg_time,
        AVG(COALESCE(max_scroll_percent, 0)) as avg_scroll
      FROM report_views
      WHERE viewed_at >= ?
    `,
    args: [thresholdStr],
  });

  // Get total clicks
  const clickStats = await db.execute({
    sql: `
      SELECT COUNT(*) as total_clicks
      FROM report_clicks
      WHERE clicked_at >= ?
    `,
    args: [thresholdStr],
  });

  // Get top reports
  const topReportsResult = await db.execute({
    sql: `
      SELECT audit_id, COUNT(*) as views
      FROM report_views
      WHERE viewed_at >= ?
      GROUP BY audit_id
      ORDER BY views DESC
      LIMIT 10
    `,
    args: [thresholdStr],
  });

  // Get geo breakdown
  const geoResult = await db.execute({
    sql: `
      SELECT country, COUNT(*) as count
      FROM report_views
      WHERE viewed_at >= ? AND country IS NOT NULL
      GROUP BY country
      ORDER BY count DESC
      LIMIT 20
    `,
    args: [thresholdStr],
  });

  const viewRow = viewStats.rows[0] || {};
  const clickRow = clickStats.rows[0] || {};

  const topReports = topReportsResult.rows.map((row) => ({
    auditId: row.audit_id as string,
    views: row.views as number,
  }));

  const geoBreakdown: Record<string, number> = {};
  for (const row of geoResult.rows) {
    geoBreakdown[row.country as string] = row.count as number;
  }

  return {
    totalViews: (viewRow.total_views as number) || 0,
    uniqueVisitors: (viewRow.unique_visitors as number) || 0,
    avgTimeOnPageMs: Math.round((viewRow.avg_time as number) || 0),
    avgScrollPercent: Math.round((viewRow.avg_scroll as number) || 0),
    totalClicks: (clickRow.total_clicks as number) || 0,
    topReports,
    geoBreakdown,
  };
}
