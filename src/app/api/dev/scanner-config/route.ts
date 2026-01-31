import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

const CONFIG_PATH = path.join(process.cwd(), "src/config/scanner-phases.json")

export async function GET() {
  try {
    const content = await fs.readFile(CONFIG_PATH, "utf-8")
    return NextResponse.json(JSON.parse(content))
  } catch (error) {
    return NextResponse.json({ error: "Failed to read config" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Only available in development" }, { status: 403 })
  }

  try {
    const body = await request.json()

    // Validate structure
    if (!body.phases || !Array.isArray(body.phases)) {
      return NextResponse.json({ error: "Invalid config structure" }, { status: 400 })
    }

    // Write to file with pretty formatting
    await fs.writeFile(CONFIG_PATH, JSON.stringify(body, null, 2) + "\n", "utf-8")

    return NextResponse.json({ success: true, path: "src/config/scanner-phases.json" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to save config" }, { status: 500 })
  }
}
