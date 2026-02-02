import { NextRequest, NextResponse } from "next/server";
import {
  getLead,
  updateLead,
  deleteLead,
  getLeadReportAccess,
} from "@/lib/lead-storage";

interface RouteParams {
  params: Promise<{ leadId: string }>;
}

// GET /api/leads/[leadId] - Get lead details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { leadId } = await params;

    const lead = await getLead(leadId);

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    // Get report access history
    const reportAccess = await getLeadReportAccess(leadId);

    return NextResponse.json({
      lead,
      reportAccess,
    });
  } catch (error) {
    console.error("[Leads] Get failed:", error);
    return NextResponse.json(
      { error: "Failed to get lead" },
      { status: 500 }
    );
  }
}

// PATCH /api/leads/[leadId] - Update lead
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { leadId } = await params;
    const body = await request.json();

    const { status, notes } = body;

    await updateLead(leadId, { status, notes });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Leads] Update failed:", error);
    return NextResponse.json(
      { error: "Failed to update lead" },
      { status: 500 }
    );
  }
}

// DELETE /api/leads/[leadId] - Delete lead
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { leadId } = await params;

    await deleteLead(leadId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Leads] Delete failed:", error);
    return NextResponse.json(
      { error: "Failed to delete lead" },
      { status: 500 }
    );
  }
}
