import { NextRequest, NextResponse } from "next/server";
import { recordClick, type ClickData } from "@/lib/analytics";

/**
 * POST /api/analytics/click
 * Record a CTA click event
 *
 * Request body:
 * {
 *   auditId: string;
 *   visitorId: string;
 *   sessionId: string;
 *   ctaType: string;
 *   ctaLocation?: string;
 * }
 *
 * Response: { clickId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { auditId, visitorId, sessionId, ctaType } = body;

    // Validate required fields
    if (!auditId || !visitorId || !sessionId || !ctaType) {
      return NextResponse.json(
        { error: "auditId, visitorId, sessionId, and ctaType are required" },
        { status: 400 }
      );
    }

    const clickData: ClickData = {
      auditId,
      visitorId,
      sessionId,
      ctaType,
      ctaLocation: body.ctaLocation,
    };

    const clickId = await recordClick(clickData);

    return NextResponse.json({ clickId });
  } catch (error) {
    console.error("[Analytics] Failed to record click:", error);
    return NextResponse.json(
      { error: "Failed to record click" },
      { status: 500 }
    );
  }
}
