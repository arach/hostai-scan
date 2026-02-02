import { NextResponse } from "next/server";
import { clearAdminAuthCookie } from "@/lib/admin-auth";

export async function POST() {
  try {
    await clearAdminAuthCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin Logout] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
