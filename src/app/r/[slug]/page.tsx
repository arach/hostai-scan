import { notFound, redirect } from "next/navigation";
import { getLinkBySlug, isLinkExpired } from "@/lib/link-storage";
import { loadAudit } from "@/lib/audit-storage";
import { ExpiredReport } from "@/components/report/expired-report";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Short URL handler: /r/[slug] -> /report/[auditId]
export default async function SlugReportPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const queryParams = await searchParams;

  const link = await getLinkBySlug(slug);

  if (!link) {
    notFound();
  }

  // Check expiration
  if (isLinkExpired(link)) {
    const audit = await loadAudit(link.auditId);
    return (
      <ExpiredReport
        domain={audit?.domain}
        expiresAt={link.expiresAt ?? undefined}
      />
    );
  }

  // Build redirect URL with query params
  const url = new URL(`/report/${link.auditId}`, "http://localhost");

  // Preserve existing query params
  Object.entries(queryParams).forEach(([key, value]) => {
    if (typeof value === "string") {
      url.searchParams.set(key, value);
    }
  });

  // Add default UTM params if not already present
  if (link.defaultUtmSource && !queryParams.utm_source) {
    url.searchParams.set("utm_source", link.defaultUtmSource);
  }
  if (link.defaultUtmMedium && !queryParams.utm_medium) {
    url.searchParams.set("utm_medium", link.defaultUtmMedium);
  }
  if (link.defaultUtmCampaign && !queryParams.utm_campaign) {
    url.searchParams.set("utm_campaign", link.defaultUtmCampaign);
  }

  // Redirect to the actual report page
  redirect(`${url.pathname}${url.search}`);
}

// Generate metadata for the redirect page
export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const link = await getLinkBySlug(slug);

  if (!link) {
    return { title: "Report Not Found" };
  }

  const audit = await loadAudit(link.auditId);

  if (!audit) {
    return { title: "Report Not Found" };
  }

  return {
    title: `${audit.domain} - Website Audit Report | GetHost.AI`,
    description: `Website audit report for ${audit.domain}`,
  };
}
