"use client";

import { useState } from "react";
import { ArrowRight, Globe, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface AuditFormProps {
  onSubmit: (domain: string) => void;
  isLoading?: boolean;
}

export function AuditForm({ onSubmit, isLoading }: AuditFormProps) {
  const [domain, setDomain] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!domain.includes(".")) {
      setError("Please enter a valid domain (e.g., yoursite.com)");
      return;
    }

    // Clean the domain
    const cleanDomain = domain
      .replace(/^(https?:\/\/)?(www\.)?/, "")
      .split("/")[0];

    onSubmit(cleanDomain);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Content */}
      <div className="flex-1 flex flex-col justify-center p-8 lg:p-16 xl:p-24 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-card via-background to-background -z-10" />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />

        <div className="max-w-xl mx-auto lg:mx-0 relative z-10">
          {/* Badge */}
          <Badge variant="outline" className="mb-8 gap-2 border-primary/30 text-primary">
            <Sparkles className="size-3" />
            Free Website Audit
          </Badge>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Stop Losing Guests to{" "}
            <span className="text-gradient-gold">Bad UX.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg text-muted-foreground mb-10 leading-relaxed max-w-lg">
            Get a comprehensive, AI-powered audit of your short-term rental
            website. Uncover hidden revenue leaks in your SEO, mobile
            experience, and trust signals.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="max-w-lg">
            <div className="relative group">
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/40 to-primary/20 rounded-xl blur opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition duration-500" />

              {/* Input container */}
              <div className="relative flex items-center gap-2 bg-card border border-border rounded-xl p-2 shadow-lg">
                <Globe className="text-muted-foreground ml-3 size-5 shrink-0" />
                <Input
                  type="text"
                  placeholder="yoursite.com"
                  value={domain}
                  onChange={(e) => {
                    setDomain(e.target.value);
                    setError("");
                  }}
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="lg"
                  disabled={isLoading}
                  className="shrink-0"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Analyzing
                    </span>
                  ) : (
                    <>
                      Run Audit
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive mt-3 ml-1">{error}</p>
            )}
          </form>

          {/* Trust signals */}
          <div className="mt-12 flex flex-wrap gap-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <CheckCircle2 className="size-4 text-success" />
              No Credit Card
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <CheckCircle2 className="size-4 text-success" />
              Instant Results
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <CheckCircle2 className="size-4 text-success" />
              50+ Checks
            </div>
          </div>
        </div>
      </div>

      {/* Right Preview (Desktop Only) */}
      <div className="hidden lg:flex flex-1 bg-card items-center justify-center relative overflow-hidden border-l border-border">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        {/* Preview card */}
        <div className="relative z-10 p-12 w-full max-w-lg">
          <div className="bg-background/90 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-6 transform rotate-2 hover:rotate-0 transition duration-500">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
              <div className="h-8 w-16 bg-success/20 rounded text-success flex items-center justify-center font-bold text-xs">
                92/100
              </div>
            </div>

            {/* Content blocks */}
            <div className="space-y-4">
              <div className="h-24 bg-muted/50 rounded-lg border border-border p-4">
                <div className="h-3 w-20 bg-muted rounded mb-2" />
                <div className="h-2 w-full bg-muted rounded mb-2 opacity-50" />
                <div className="h-2 w-2/3 bg-muted rounded opacity-50" />
              </div>
              <div className="h-24 bg-muted/50 rounded-lg border border-border p-4">
                <div className="h-3 w-24 bg-muted rounded mb-2" />
                <div className="h-2 w-full bg-muted rounded mb-2 opacity-50" />
                <div className="h-2 w-4/5 bg-muted rounded opacity-50" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
