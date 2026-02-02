import { NextRequest, NextResponse } from "next/server";
import {
  verifyAdminPassword,
  setAdminAuthCookie,
  isAdminAuthEnabled,
} from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    // If auth is not enabled, just return success
    if (!isAdminAuthEnabled()) {
      return NextResponse.json({ success: true, authEnabled: false });
    }

    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "Password is required" },
        { status: 400 }
      );
    }

    const result = verifyAdminPassword(password);

    if (result.success && result.token) {
      await setAdminAuthCookie(result.token);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: "Invalid password" },
      { status: 401 }
    );
  } catch (error) {
    console.error("[Admin Login] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
