"use client";

import { Clock, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ExpiredReportProps {
  domain?: string;
  expiresAt?: string;
}

export function ExpiredReport({ domain, expiresAt }: ExpiredReportProps) {
  const formattedDate = expiresAt
    ? new Date(expiresAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-6 px-6 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Report Link Expired</h1>
            <p className="text-muted-foreground">
              {domain ? (
                <>
                  The report for <span className="font-medium">{domain}</span>{" "}
                  is no longer accessible.
                </>
              ) : (
                "This report link is no longer accessible."
              )}
            </p>
            {formattedDate && (
              <p className="text-sm text-muted-foreground mt-2">
                Expired on {formattedDate}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              Contact the report sender for an updated link, or request a new
              audit.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button asChild variant="outline">
                <Link href="/">
                  <Home className="w-4 h-4" />
                  Go Home
                </Link>
              </Button>
              <Button asChild>
                <Link href="/admin">
                  <RefreshCw className="w-4 h-4" />
                  New Audit
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ExpiredReport;
