import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const PLANS_DIR = path.join(process.cwd(), "docs/plans");

interface PlanMeta {
  slug: string;
  title: string;
  status?: string;
  category?: string;
}

function extractFrontmatter(content: string): { meta: Record<string, string>; body: string } {
  const lines = content.split("\n");
  const meta: Record<string, string> = {};
  let bodyStartIndex = 0;

  // Check for YAML frontmatter
  if (lines[0]?.trim() === "---") {
    for (let i = 1; i < lines.length; i++) {
      if (lines[i]?.trim() === "---") {
        bodyStartIndex = i + 1;
        break;
      }
      const match = lines[i]?.match(/^(\w+):\s*(.+)$/);
      if (match) {
        meta[match[1]] = match[2].replace(/^["']|["']$/g, "");
      }
    }
  }

  // Extract title from first H1 if not in frontmatter
  if (!meta.title) {
    const body = lines.slice(bodyStartIndex).join("\n");
    const h1Match = body.match(/^#\s+(.+)$/m);
    if (h1Match) {
      meta.title = h1Match[1];
    }
  }

  // Extract status from content if present
  if (!meta.status) {
    const statusMatch = content.match(/\*\*Status:\*\*\s*(.+)/);
    if (statusMatch) {
      meta.status = statusMatch[1].trim();
    }
  }

  // Extract category from content if present
  if (!meta.category) {
    const categoryMatch = content.match(/\*\*Category:\*\*\s*(.+)/);
    if (categoryMatch) {
      meta.category = categoryMatch[1].trim();
    }
  }

  return { meta, body: lines.slice(bodyStartIndex).join("\n") };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  try {
    // If slug provided, return single plan content
    if (slug) {
      const filePath = path.join(PLANS_DIR, `${slug}.md`);
      const content = await fs.readFile(filePath, "utf-8");
      const { meta, body } = extractFrontmatter(content);

      return NextResponse.json({
        slug,
        title: meta.title || slug,
        status: meta.status,
        category: meta.category,
        content,
      });
    }

    // Otherwise, list all plans
    const files = await fs.readdir(PLANS_DIR);
    const plans: PlanMeta[] = [];

    for (const file of files) {
      if (!file.endsWith(".md")) continue;

      const slug = file.replace(".md", "");
      const filePath = path.join(PLANS_DIR, file);
      const content = await fs.readFile(filePath, "utf-8");
      const { meta } = extractFrontmatter(content);

      plans.push({
        slug,
        title: meta.title || slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        status: meta.status,
        category: meta.category,
      });
    }

    // Sort plans alphabetically by title
    plans.sort((a, b) => a.title.localeCompare(b.title));

    return NextResponse.json({ plans });
  } catch (error) {
    console.error("Failed to read plans:", error);
    return NextResponse.json(
      { error: "Failed to load plans" },
      { status: 500 }
    );
  }
}
