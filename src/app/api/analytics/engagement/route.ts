import { NextRequest, NextResponse } from "next/server";
import { updateEngagement } from "@/lib/analytics";

/**
 * POST /api/analytics/engagement
 * Update engagement metrics for an existing view
 * This is a beacon endpoint - fire and forget, minimal response
 *
 * Request body:
 * {
 *   viewId: string;
 *   timeOnPageMs: number;
 *   maxScrollPercent: number;
 * }
 *
 * Response: { success: true }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { viewId, timeOnPageMs, maxScrollPercent } = body;

    // Validate required fields
    if (!viewId) {
      return NextResponse.json(
        { error: "viewId is required" },
        { status: 400 }
      );
    }

    // Validate numeric fields
    const time = typeof timeOnPageMs === "number" ? timeOnPageMs : 0;
    const scroll = typeof maxScrollPercent === "number" ? maxScrollPercent : 0;

    await updateEngagement({
      viewId,
      timeOnPageMs: Math.max(0, Math.round(time)),
      maxScrollPercent: Math.min(100, Math.max(0, Math.round(scroll))),
    });

    // Minimal response for beacon
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Analytics] Failed to update engagement:", error);
    // Still return success for beacon endpoints to avoid client errors
    // The data loss is acceptable for analytics
    return NextResponse.json({ success: true });
  }
}
