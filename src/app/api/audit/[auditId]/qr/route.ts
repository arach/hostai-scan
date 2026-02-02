import { NextRequest, NextResponse } from "next/server";
import { loadAudit } from "@/lib/audit-storage";
import { getLinkByAuditId, incrementLinkStat } from "@/lib/link-storage";
import QRCode from "qrcode";

interface QRRequest {
  includeUtm?: boolean;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  trackDownload?: boolean;
}

// GET /api/audit/[auditId]/qr - Generate QR code for report
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ auditId: string }> }
) {
  const { auditId } = await params;

  if (!auditId) {
    return NextResponse.json({ error: "Audit ID required" }, { status: 400 });
  }

  // Verify audit exists
  const audit = await loadAudit(auditId);
  if (!audit) {
    return NextResponse.json({ error: "Audit not found" }, { status: 404 });
  }

  // Get link settings for custom slug and default UTM
  const link = await getLinkByAuditId(auditId);

  // Build the report URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://gethost.ai";

  // Use custom slug if available, otherwise use audit ID
  let reportPath: string;
  if (link?.customSlug) {
    reportPath = `/r/${link.customSlug}`;
  } else {
    reportPath = `/report/${auditId}`;
  }

  const url = new URL(reportPath, baseUrl);

  // Add UTM params from query string or link defaults
  const searchParams = request.nextUrl.searchParams;
  const includeUtm = searchParams.get("includeUtm") !== "false";

  if (includeUtm) {
    const utmSource =
      searchParams.get("utmSource") || link?.defaultUtmSource || "qr";
    const utmMedium =
      searchParams.get("utmMedium") || link?.defaultUtmMedium || "print";
    const utmCampaign =
      searchParams.get("utmCampaign") || link?.defaultUtmCampaign;

    if (utmSource) url.searchParams.set("utm_source", utmSource);
    if (utmMedium) url.searchParams.set("utm_medium", utmMedium);
    if (utmCampaign) url.searchParams.set("utm_campaign", utmCampaign);
  }

  // Track download if requested
  if (searchParams.get("trackDownload") === "true") {
    await incrementLinkStat(auditId, "qr_downloads");
  }

  try {
    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(url.toString(), {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    });

    return NextResponse.json({
      qrCode: qrDataUrl,
      url: url.toString(),
      auditId,
      domain: audit.domain,
      customSlug: link?.customSlug || null,
    });
  } catch (error) {
    console.error("QR code generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 }
    );
  }
}

// POST /api/audit/[auditId]/qr - Generate QR code with custom options
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ auditId: string }> }
) {
  const { auditId } = await params;

  if (!auditId) {
    return NextResponse.json({ error: "Audit ID required" }, { status: 400 });
  }

  // Verify audit exists
  const audit = await loadAudit(auditId);
  if (!audit) {
    return NextResponse.json({ error: "Audit not found" }, { status: 404 });
  }

  let body: QRRequest;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  // Get link settings
  const link = await getLinkByAuditId(auditId);

  // Build the report URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://gethost.ai";

  let reportPath: string;
  if (link?.customSlug) {
    reportPath = `/r/${link.customSlug}`;
  } else {
    reportPath = `/report/${auditId}`;
  }

  const url = new URL(reportPath, baseUrl);

  // Add UTM params
  if (body.includeUtm !== false) {
    const utmSource = body.utmSource || link?.defaultUtmSource || "qr";
    const utmMedium = body.utmMedium || link?.defaultUtmMedium || "print";
    const utmCampaign = body.utmCampaign || link?.defaultUtmCampaign;

    if (utmSource) url.searchParams.set("utm_source", utmSource);
    if (utmMedium) url.searchParams.set("utm_medium", utmMedium);
    if (utmCampaign) url.searchParams.set("utm_campaign", utmCampaign);
  }

  // Track download
  if (body.trackDownload) {
    await incrementLinkStat(auditId, "qr_downloads");
  }

  try {
    const qrDataUrl = await QRCode.toDataURL(url.toString(), {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    });

    return NextResponse.json({
      qrCode: qrDataUrl,
      url: url.toString(),
      auditId,
      domain: audit.domain,
      customSlug: link?.customSlug || null,
    });
  } catch (error) {
    console.error("QR code generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 }
    );
  }
}
