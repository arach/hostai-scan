import { NextRequest, NextResponse } from "next/server";
import { loadAudit } from "@/lib/audit-storage";
import {
  createOrUpdateLink,
  getLinkByAuditId,
  isSlugAvailable,
  isValidSlug,
  incrementLinkStat,
  generateSignedToken,
  storeAccessToken,
} from "@/lib/link-storage";

interface LinkUpdateRequest {
  customSlug?: string | null;
  expiresAt?: string | null;
  defaultUtmSource?: string | null;
  defaultUtmMedium?: string | null;
  defaultUtmCampaign?: string | null;
  generateToken?: boolean;
}

// GET /api/audit/[auditId]/link - Get link settings
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

  const link = await getLinkByAuditId(auditId);

  // Return link settings or empty defaults
  return NextResponse.json({
    auditId,
    customSlug: link?.customSlug ?? null,
    expiresAt: link?.expiresAt ?? null,
    defaultUtmSource: link?.defaultUtmSource ?? null,
    defaultUtmMedium: link?.defaultUtmMedium ?? null,
    defaultUtmCampaign: link?.defaultUtmCampaign ?? null,
    linkCopies: link?.linkCopies ?? 0,
    qrDownloads: link?.qrDownloads ?? 0,
  });
}

// PATCH /api/audit/[auditId]/link - Update link settings
export async function PATCH(
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

  let body: LinkUpdateRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate custom slug if provided
  if (body.customSlug !== undefined && body.customSlug !== null) {
    const slug = body.customSlug.toLowerCase().trim();

    if (!isValidSlug(slug)) {
      return NextResponse.json(
        {
          error:
            "Invalid slug format. Use 3-50 lowercase letters, numbers, and hyphens. Must start and end with alphanumeric.",
        },
        { status: 400 }
      );
    }

    // Check availability
    const available = await isSlugAvailable(slug, auditId);
    if (!available) {
      return NextResponse.json(
        { error: "This slug is already in use" },
        { status: 409 }
      );
    }

    body.customSlug = slug;
  }

  // Validate expiration date if provided
  if (body.expiresAt !== undefined && body.expiresAt !== null) {
    const expiresAt = new Date(body.expiresAt);
    if (isNaN(expiresAt.getTime())) {
      return NextResponse.json(
        { error: "Invalid expiration date format" },
        { status: 400 }
      );
    }
    // Ensure expiration is in the future
    if (expiresAt <= new Date()) {
      return NextResponse.json(
        { error: "Expiration date must be in the future" },
        { status: 400 }
      );
    }
  }

  // Update link settings
  const updatedLink = await createOrUpdateLink(auditId, {
    customSlug: body.customSlug,
    expiresAt: body.expiresAt,
    defaultUtmSource: body.defaultUtmSource,
    defaultUtmMedium: body.defaultUtmMedium,
    defaultUtmCampaign: body.defaultUtmCampaign,
  });

  // Generate access token if requested and expiration is set
  let accessToken: string | null = null;
  if (body.generateToken && body.expiresAt) {
    accessToken = generateSignedToken(auditId, body.expiresAt);
    await storeAccessToken(auditId, accessToken);
  }

  return NextResponse.json({
    success: true,
    link: {
      auditId: updatedLink.auditId,
      customSlug: updatedLink.customSlug,
      expiresAt: updatedLink.expiresAt,
      defaultUtmSource: updatedLink.defaultUtmSource,
      defaultUtmMedium: updatedLink.defaultUtmMedium,
      defaultUtmCampaign: updatedLink.defaultUtmCampaign,
      linkCopies: updatedLink.linkCopies,
      qrDownloads: updatedLink.qrDownloads,
    },
    accessToken,
  });
}

// POST /api/audit/[auditId]/link - Track link copy or QR download
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ auditId: string }> }
) {
  const { auditId } = await params;

  if (!auditId) {
    return NextResponse.json({ error: "Audit ID required" }, { status: 400 });
  }

  let body: { action: "copy" | "qr_download" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.action || !["copy", "qr_download"].includes(body.action)) {
    return NextResponse.json(
      { error: "Action must be 'copy' or 'qr_download'" },
      { status: 400 }
    );
  }

  const field = body.action === "copy" ? "link_copies" : "qr_downloads";
  await incrementLinkStat(auditId, field);

  return NextResponse.json({ success: true });
}
