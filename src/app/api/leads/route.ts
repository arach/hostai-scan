import { NextRequest, NextResponse } from "next/server";
import {
  captureLead,
  checkLeadByEmail,
  listLeads,
  type LeadListParams,
} from "@/lib/lead-storage";

// POST /api/leads - Capture a new lead
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      email,
      name,
      company,
      phone,
      capturePoint,
      auditId,
      utmSource,
      utmMedium,
      utmCampaign,
      referrer,
      consentGiven,
    } = body;

    // Validate required fields
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "email is required" },
        { status: 400 }
      );
    }

    if (!capturePoint || typeof capturePoint !== "string") {
      return NextResponse.json(
        { error: "capturePoint is required" },
        { status: 400 }
      );
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const result = await captureLead({
      email,
      name,
      company,
      phone,
      capturePoint,
      auditId,
      utmSource,
      utmMedium,
      utmCampaign,
      referrer,
      consentGiven: consentGiven === true,
    });

    // Set a cookie to remember this lead
    const response = NextResponse.json({
      success: true,
      leadId: result.leadId,
      isNew: result.isNew,
    });

    // Set lead cookie for 30 days
    response.cookies.set("ghai_lead", result.leadId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[Leads] Capture failed:", error);
    return NextResponse.json(
      { error: "Failed to capture lead" },
      { status: 500 }
    );
  }
}

// GET /api/leads - List leads (admin)
// GET /api/leads?check=email@example.com - Check if email is captured
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Check mode: verify if an email is already captured
  const checkEmail = searchParams.get("check");
  if (checkEmail) {
    try {
      const result = await checkLeadByEmail(checkEmail);
      return NextResponse.json(result);
    } catch (error) {
      console.error("[Leads] Check failed:", error);
      return NextResponse.json(
        { error: "Failed to check lead" },
        { status: 500 }
      );
    }
  }

  // List mode: paginated lead list for admin
  try {
    const params: LeadListParams = {
      status: searchParams.get("status") || undefined,
      capturePoint: searchParams.get("capture_point") || undefined,
      search: searchParams.get("search") || undefined,
      limit: parseInt(searchParams.get("limit") || "50", 10),
      offset: parseInt(searchParams.get("offset") || "0", 10),
      sortBy: (searchParams.get("sort") as LeadListParams["sortBy"]) || "captured_at",
      sortOrder: (searchParams.get("order") as "asc" | "desc") || "desc",
    };

    const result = await listLeads(params);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Leads] List failed:", error);
    return NextResponse.json(
      { error: "Failed to list leads" },
      { status: 500 }
    );
  }
}
