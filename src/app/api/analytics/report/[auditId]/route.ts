import { NextRequest, NextResponse } from "next/server";
import { getReportStats } from "@/lib/analytics";

interface RouteParams {
  params: Promise<{ auditId: string }>;
}

/**
 * GET /api/analytics/report/[auditId]
 * Get analytics stats for a specific report
 *
 * Response:
 * {
 *   totalViews: number;
 *   uniqueVisitors: number;
 *   avgTimeOnPageMs: number;
 *   avgScrollPercent: number;
 *   ctaClicks: number;
 *   clicksByType: Record<string, number>;
 * }
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { auditId } = await params;

    if (!auditId) {
      return NextResponse.json(
        { error: "auditId is required" },
        { status: 400 }
      );
    }

    const stats = await getReportStats(auditId);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("[Analytics] Failed to get report stats:", error);
    return NextResponse.json(
      { error: "Failed to get report stats" },
      { status: 500 }
    );
  }
}
