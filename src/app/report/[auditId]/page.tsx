import { notFound } from "next/navigation";
import { loadAudit } from "@/lib/audit-storage";
import { getLinkByAuditId, isLinkExpired } from "@/lib/link-storage";
import { PublicReportView } from "@/components/report";
import { ReportVariantB } from "@/components/report/variants/report-variant-b";
import { ReportVariantC } from "@/components/report/variants/report-variant-c";
import { ExpiredReport } from "@/components/report/expired-report";
import { GATracker } from "@/components/report/ga-tracker";
import { AnalyticsTracker } from "@/components/report/analytics-tracker";
import type { AuditResult } from "@/types/audit";

interface PageProps {
  params: Promise<{ auditId: string }>;
  searchParams: Promise<{ v?: string }>;
}

// This page loads a saved audit from JSON - completely static, no regeneration
export default async function ReportPage({ params, searchParams }: PageProps) {
  const { auditId } = await params;
  const { v: variant } = await searchParams;

  const audit = await loadAudit(auditId);

  if (!audit) {
    notFound();
  }

  // Check if the report link has expired
  const linkSettings = await getLinkByAuditId(auditId);
  if (linkSettings && isLinkExpired(linkSettings)) {
    return (
      <ExpiredReport
        domain={audit.domain}
        expiresAt={linkSettings.expiresAt ?? undefined}
      />
    );
  }

  const result = audit.result as AuditResult;

  // Select variant based on query param
  switch (variant) {
    case "b":
      return (
        <>
          <GATracker auditId={auditId} />
          <AnalyticsTracker auditId={auditId} />
          <ReportVariantB result={result} auditId={auditId} />
        </>
      );
    case "c":
      return (
        <>
          <GATracker auditId={auditId} />
          <AnalyticsTracker auditId={auditId} />
          <ReportVariantC result={result} auditId={auditId} />
        </>
      );
    case "a":
    default:
      return (
        <>
          <GATracker auditId={auditId} />
          <AnalyticsTracker auditId={auditId} />
          <PublicReportView result={result} auditId={auditId} />
        </>
      );
  }
}

// Generate metadata for sharing
export async function generateMetadata({ params }: PageProps) {
  const { auditId } = await params;
  const audit = await loadAudit(auditId);

  if (!audit) {
    return { title: "Report Not Found" };
  }

  const result = audit.result as AuditResult;

  return {
    title: `${audit.domain} - Website Audit Report | GetHost.AI`,
    description: `${result.summary} Overall score: ${result.overallScore}/100`,
    openGraph: {
      title: `${audit.domain} Website Audit`,
      description: `Score: ${result.overallScore}/100 - ${result.summary}`,
    },
  };
}
