import { NextRequest, NextResponse } from "next/server";
import { runAudit } from "./runner";

export const maxDuration = 60;

interface AuditRequest {
  domain: string;
}

// Synchronous audit endpoint (kept for backward compatibility)
export async function POST(request: NextRequest) {
  try {
    const body: AuditRequest = await request.json();
    const { domain } = body;

    if (!domain) {
      return NextResponse.json(
        { error: "Domain is required" },
        { status: 400 }
      );
    }

    const cleanDomain = domain
      .replace(/^(https?:\/\/)?(www\.)?/, "")
      .split("/")[0];

    const url = `https://${cleanDomain}`;
    const result = await runAudit(url, cleanDomain);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Audit failed:", error);
    return NextResponse.json(
      { error: "Audit failed", details: String(error) },
      { status: 500 }
    );
  }
}
