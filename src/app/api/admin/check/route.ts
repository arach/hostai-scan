import { NextResponse } from "next/server";
import { isAdminAuthenticated, isAdminAuthEnabled } from "@/lib/admin-auth";

export async function GET() {
  try {
    // If auth is not enabled, always return authenticated
    if (!isAdminAuthEnabled()) {
      return NextResponse.json({
        authenticated: true,
        authEnabled: false,
      });
    }

    const authenticated = await isAdminAuthenticated();

    return NextResponse.json({
      authenticated,
      authEnabled: true,
    });
  } catch (error) {
    console.error("[Admin Check] Error:", error);
    return NextResponse.json(
      { authenticated: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
