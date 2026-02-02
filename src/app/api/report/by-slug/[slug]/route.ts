import { NextRequest, NextResponse } from "next/server";
import { getLinkBySlug, isLinkExpired } from "@/lib/link-storage";
import { loadAudit } from "@/lib/audit-storage";

// GET /api/report/by-slug/[slug] - Resolve custom slug to audit ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json({ error: "Slug required" }, { status: 400 });
  }

  const link = await getLinkBySlug(slug);

  if (!link) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  // Check expiration
  if (isLinkExpired(link)) {
    return NextResponse.json(
      {
        error: "This report link has expired",
        expired: true,
        expiresAt: link.expiresAt,
      },
      { status: 410 }
    );
  }

  // Verify the audit still exists
  const audit = await loadAudit(link.auditId);
  if (!audit) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  return NextResponse.json({
    auditId: link.auditId,
    domain: audit.domain,
    customSlug: link.customSlug,
    defaultUtmSource: link.defaultUtmSource,
    defaultUtmMedium: link.defaultUtmMedium,
    defaultUtmCampaign: link.defaultUtmCampaign,
  });
}
