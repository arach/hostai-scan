"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  FileText,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  Lightbulb,
  List,
  Copy,
  Check,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Highlight, themes } from "prism-react-renderer";

interface PlanMeta {
  slug: string;
  title: string;
  status?: string;
  category?: string;
}

interface PlanContent extends PlanMeta {
  content: string;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

function getStatusVariant(status?: string): "default" | "secondary" | "success" | "warning" | "error" {
  if (!status) return "secondary";
  const lower = status.toLowerCase();
  if (lower.includes("complete") || lower.includes("done")) return "success";
  if (lower.includes("progress") || lower.includes("active")) return "warning";
  return "secondary";
}

function getStatusIcon(status?: string) {
  if (!status) return <Lightbulb className="size-3.5" />;
  const lower = status.toLowerCase();
  if (lower.includes("complete") || lower.includes("done")) {
    return <CheckCircle2 className="size-3.5 text-green-500" />;
  }
  if (lower.includes("progress") || lower.includes("active")) {
    return <Clock className="size-3.5 text-yellow-500" />;
  }
  if (lower.includes("planned") || lower.includes("draft") || lower.includes("design")) {
    return <AlertCircle className="size-3.5 text-blue-500" />;
  }
  return <Lightbulb className="size-3.5 text-muted-foreground" />;
}

function extractToc(content: string): TocItem[] {
  const headingRegex = /^(#{2,4})\s+(.+)$/gm;
  const items: TocItem[] = [];
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].replace(/\*\*/g, "").trim();
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
    items.push({ id, text, level });
  }
  return items;
}

function CodeBlock({ children, className }: { children: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const language = className?.replace("language-", "") || "text";
  const code = String(children).replace(/\n$/, "");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <Button
        variant="ghost"
        size="sm"
        className="absolute right-2 top-2 h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="size-3.5 text-green-500" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </Button>
      <Highlight theme={themes.oneDark} code={code} language={language as any}>
        {({ className: hlClassName, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={cn(
              hlClassName,
              "rounded-lg border border-border p-4 overflow-x-auto text-sm"
            )}
            style={{ ...style, backgroundColor: "var(--code-bg, #282c34)" }}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                <span className="select-none text-muted-foreground/50 w-8 inline-block text-right mr-4 text-xs">
                  {i + 1}
                </span>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
      {children}
    </code>
  );
}

export default function PlansPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedSlug = searchParams.get("doc");

  const [plans, setPlans] = useState<PlanMeta[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PlanContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toc = useMemo(() => {
    if (!selectedPlan?.content) return [];
    return extractToc(selectedPlan.content);
  }, [selectedPlan?.content]);

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    if (selectedSlug && plans.length > 0) {
      loadPlan(selectedSlug);
    } else if (!selectedSlug) {
      setSelectedPlan(null);
    }
  }, [selectedSlug, plans]);

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/admin/plans");
      const data = await res.json();
      setPlans(data.plans || []);
    } catch (error) {
      console.error("Failed to fetch plans:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPlan = async (slug: string) => {
    setIsLoadingContent(true);
    try {
      const res = await fetch(`/api/admin/plans?slug=${slug}`);
      const data = await res.json();
      setSelectedPlan(data);
    } catch (error) {
      console.error("Failed to load plan:", error);
    } finally {
      setIsLoadingContent(false);
    }
  };

  const selectPlan = useCallback((slug: string) => {
    router.push(`/admin/plans?doc=${slug}`);
    setMobileSidebarOpen(false);
  }, [router]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 shrink-0 border-b border-border bg-background/95 backdrop-blur z-40">
        <div className="px-4 sm:px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (window.location.href = "/admin")}
              className="gap-1.5"
            >
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Admin</span>
            </Button>
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-muted-foreground" />
              <h1 className="font-semibold">Plans</h1>
            </div>
            {selectedPlan && (
              <>
                <ChevronRight className="size-4 text-muted-foreground hidden sm:block" />
                <span className="text-sm text-muted-foreground hidden sm:block truncate max-w-[200px]">
                  {selectedPlan.title}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="hidden sm:flex">
              {plans.length} docs
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            >
              {mobileSidebarOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Body: fixed sidebars + scrollable content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Fixed */}
        <aside
          className={cn(
            "w-64 shrink-0 border-r border-border bg-muted/30 overflow-y-auto",
            "fixed lg:static inset-y-14 lg:inset-y-0 left-0 z-30",
            "transform transition-transform lg:transform-none",
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          <div className="p-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Documents
            </h2>
            <nav className="space-y-1">
              {plans.map((plan) => (
                <button
                  key={plan.slug}
                  onClick={() => selectPlan(plan.slug)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                    "hover:bg-muted",
                    selectedSlug === plan.slug
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground/80"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(plan.status)}
                    <span className="truncate">{plan.title}</span>
                  </div>
                  {plan.category && (
                    <span className="text-xs text-muted-foreground ml-5">
                      {plan.category}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-background/80 z-20 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Main content - Scrollable */}
        <main className="flex-1 overflow-y-auto">
          {!selectedSlug ? (
            /* No document selected - show grid */
            <div className="p-6 max-w-5xl mx-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Plan Documents</h2>
                <p className="text-muted-foreground">
                  Implementation plans, specifications, and design documents for GetHost.AI features.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {plans.map((plan) => (
                  <button
                    key={plan.slug}
                    onClick={() => selectPlan(plan.slug)}
                    className="text-left p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 p-2 rounded-md bg-muted group-hover:bg-primary/10 transition-colors">
                        <FileText className="size-4 text-muted-foreground group-hover:text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                            {plan.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {plan.status && (
                            <Badge variant={getStatusVariant(plan.status)} className="text-xs">
                              {plan.status}
                            </Badge>
                          )}
                          {plan.category && (
                            <Badge variant="outline" className="text-xs">
                              {plan.category}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 font-mono">
                          {plan.slug}.md
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : isLoadingContent ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : selectedPlan ? (
            <div className="flex h-full">
              {/* Document content - scrolls within main */}
              <div className="flex-1 min-w-0 p-6 lg:p-8 overflow-y-auto">
                {/* Document header */}
                <div className="mb-8 pb-6 border-b border-border max-w-4xl">
                  <div className="flex items-center gap-2 mb-3">
                    {selectedPlan.status && (
                      <Badge variant={getStatusVariant(selectedPlan.status)}>
                        {selectedPlan.status}
                      </Badge>
                    )}
                    {selectedPlan.category && (
                      <Badge variant="outline">{selectedPlan.category}</Badge>
                    )}
                  </div>
                  <h1 className="text-3xl font-bold mb-2">{selectedPlan.title}</h1>
                  <p className="text-sm text-muted-foreground font-mono">
                    docs/plans/{selectedPlan.slug}.md
                  </p>
                </div>

                {/* Markdown content */}
                <article className="prose prose-neutral dark:prose-invert max-w-4xl prose-headings:scroll-mt-20 prose-p:leading-7 prose-p:my-4 prose-li:leading-7 prose-ul:my-4 prose-ol:my-4 prose-table:text-sm prose-th:bg-muted/50 prose-th:p-3 prose-th:border prose-th:border-border prose-td:p-3 prose-td:border prose-td:border-border prose-img:rounded-lg prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-blockquote:border-l-primary prose-blockquote:bg-muted/30 prose-blockquote:py-1 prose-blockquote:not-italic prose-strong:text-foreground">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, className, children, ...props }) {
                        const isInline = !className;
                        if (isInline) {
                          return <InlineCode>{children}</InlineCode>;
                        }
                        return (
                          <CodeBlock className={className}>
                            {String(children)}
                          </CodeBlock>
                        );
                      },
                      pre({ children }) {
                        return <>{children}</>;
                      },
                      h1() {
                        // Skip H1 - we show the title in the document header
                        return null;
                      },
                      h2({ children, ...props }) {
                        const text = String(children);
                        const id = text
                          .toLowerCase()
                          .replace(/[^\w\s-]/g, "")
                          .replace(/\s+/g, "-");
                        return (
                          <h2
                            id={id}
                            className="text-xl font-bold mt-10 mb-4 pb-2 border-b border-border/60 text-foreground"
                            {...props}
                          >
                            {children}
                          </h2>
                        );
                      },
                      h3({ children, ...props }) {
                        const text = String(children);
                        const id = text
                          .toLowerCase()
                          .replace(/[^\w\s-]/g, "")
                          .replace(/\s+/g, "-");
                        return (
                          <h3
                            id={id}
                            className="text-base font-semibold mt-8 mb-3 text-foreground flex items-center gap-2"
                            {...props}
                          >
                            <span className="w-1 h-4 bg-primary/60 rounded-full" />
                            {children}
                          </h3>
                        );
                      },
                      h4({ children, ...props }) {
                        const text = String(children);
                        const id = text
                          .toLowerCase()
                          .replace(/[^\w\s-]/g, "")
                          .replace(/\s+/g, "-");
                        return (
                          <h4
                            id={id}
                            className="text-sm font-semibold mt-6 mb-2 text-foreground/80 uppercase tracking-wide"
                            {...props}
                          >
                            {children}
                          </h4>
                        );
                      },
                      hr() {
                        // Hide markdown HRs - we use H2 borders for section separation
                        return <div className="my-6" />;
                      },
                      table({ children }) {
                        return (
                          <div className="overflow-x-auto my-6 rounded-lg border border-border bg-card">
                            <table className="m-0 w-full">{children}</table>
                          </div>
                        );
                      },
                      thead({ children }) {
                        return <thead className="bg-muted/70">{children}</thead>;
                      },
                      th({ children, ...props }) {
                        return (
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border" {...props}>
                            {children}
                          </th>
                        );
                      },
                      td({ children, ...props }) {
                        return (
                          <td className="px-4 py-3 text-sm border-b border-border/50" {...props}>
                            {children}
                          </td>
                        );
                      },
                      p({ children, node, ...props }) {
                        // Check if this paragraph contains metadata (Status:, Category:, etc.)
                        // by looking at the raw text content
                        const getTextContent = (node: any): string => {
                          if (!node) return "";
                          if (typeof node === "string") return node;
                          if (node.props?.children) {
                            if (Array.isArray(node.props.children)) {
                              return node.props.children.map(getTextContent).join("");
                            }
                            return getTextContent(node.props.children);
                          }
                          if (Array.isArray(node)) {
                            return node.map(getTextContent).join("");
                          }
                          return "";
                        };
                        const text = getTextContent(children);
                        const isMetadata = text.includes("Status:") && (text.includes("Category:") || text.includes("Date:") || text.includes("Version:"));
                        if (isMetadata) {
                          return (
                            <div className="text-sm text-muted-foreground mb-8 py-2 px-3 rounded-md bg-muted/40 border border-border/40 not-prose">
                              {children}
                            </div>
                          );
                        }
                        return <p {...props}>{children}</p>;
                      },
                      ul({ children }) {
                        return <ul className="my-4 space-y-2">{children}</ul>;
                      },
                      ol({ children }) {
                        return <ol className="my-4 space-y-2">{children}</ol>;
                      },
                      li({ children }) {
                        return <li className="leading-7">{children}</li>;
                      },
                    }}
                  >
                    {selectedPlan.content}
                  </ReactMarkdown>
                </article>

                {/* Bottom padding for scroll */}
                <div className="h-24" />
              </div>

              {/* Right TOC - Fixed */}
              {toc.length > 0 && (
                <aside className="hidden xl:block w-56 shrink-0 border-l border-border bg-background overflow-y-auto">
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <List className="size-3.5" />
                      On this page
                    </div>
                    <nav className="space-y-1">
                      {toc.map((item, i) => (
                        <button
                          key={i}
                          onClick={() => scrollToHeading(item.id)}
                          className={cn(
                            "block text-left text-sm text-muted-foreground hover:text-foreground transition-colors truncate w-full py-1",
                            item.level === 2 && "font-medium",
                            item.level === 3 && "pl-3 text-xs",
                            item.level === 4 && "pl-6 text-xs"
                          )}
                        >
                          {item.text}
                        </button>
                      ))}
                    </nav>
                  </div>
                </aside>
              )}
            </div>
          ) : null}
        </main>
      </div>

      <style jsx global>{`
        :root {
          --code-bg: #1e1e1e;
        }
        .dark {
          --code-bg: #1e1e1e;
        }
      `}</style>
    </div>
  );
}
