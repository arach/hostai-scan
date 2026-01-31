import { notFound } from "next/navigation";
import { loadAudit } from "@/lib/audit-storage";
import { ReportDashboard } from "@/components/report-dashboard";
import type { AuditResult } from "@/types/audit";

interface PageProps {
  params: Promise<{ auditId: string }>;
}

// This page loads a saved audit from JSON - completely static, no regeneration
export default async function ReportPage({ params }: PageProps) {
  const { auditId } = await params;

  const audit = await loadAudit(auditId);

  if (!audit) {
    notFound();
  }

  const result = audit.result as AuditResult;

  return <ReportDashboard result={result} />;
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
