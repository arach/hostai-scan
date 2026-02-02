import { NextRequest, NextResponse } from "next/server";
import { recordView, type ViewData } from "@/lib/analytics";

/**
 * POST /api/analytics/view
 * Record a new report view event
 *
 * Request body:
 * {
 *   auditId: string;
 *   visitorId: string;
 *   sessionId: string;
 *   referrer?: string;
 *   utmSource?: string;
 *   utmMedium?: string;
 *   utmCampaign?: string;
 *   deviceType?: string;
 *   browser?: string;
 *   os?: string;
 * }
 *
 * Response: { viewId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { auditId, visitorId, sessionId } = body;

    // Validate required fields
    if (!auditId || !visitorId || !sessionId) {
      return NextResponse.json(
        { error: "auditId, visitorId, and sessionId are required" },
        { status: 400 }
      );
    }

    // Get country from Vercel's geo header
    const country = request.headers.get("x-vercel-ip-country") || undefined;

    const viewData: ViewData = {
      auditId,
      visitorId,
      sessionId,
      referrer: body.referrer,
      utmSource: body.utmSource,
      utmMedium: body.utmMedium,
      utmCampaign: body.utmCampaign,
      country,
      deviceType: body.deviceType,
      browser: body.browser,
      os: body.os,
    };

    const viewId = await recordView(viewData);

    return NextResponse.json({ viewId });
  } catch (error) {
    console.error("[Analytics] Failed to record view:", error);
    return NextResponse.json(
      { error: "Failed to record view" },
      { status: 500 }
    );
  }
}
