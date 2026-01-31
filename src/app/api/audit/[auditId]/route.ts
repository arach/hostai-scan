import { NextRequest, NextResponse } from "next/server";
import { loadAudit } from "@/lib/audit-storage";

// GET /api/audit/[auditId] - Load a stored audit by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ auditId: string }> }
) {
  const { auditId } = await params;

  if (!auditId) {
    return NextResponse.json({ error: "Audit ID required" }, { status: 400 });
  }

  const audit = await loadAudit(auditId);

  if (!audit) {
    return NextResponse.json({ error: "Audit not found" }, { status: 404 });
  }

  return NextResponse.json(audit);
}
