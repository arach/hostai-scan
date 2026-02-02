import Link from 'next/link';
import { HostAILogo } from '@/components/hostai-logo';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-fd-background">
      <div className="max-w-3xl text-center">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <HostAILogo className="h-8 w-auto" />
        </div>

        {/* Headline */}
        <h1 className="mb-4 text-5xl font-bold tracking-tight">
          <span className="hostai-gradient-text">Audit Rules</span>
          <br />
          <span className="text-fd-foreground">Documentation</span>
        </h1>

        {/* Description */}
        <p className="mb-8 text-lg text-fd-muted-foreground max-w-xl mx-auto">
          33 evidence-based rules across 7 categories. Detect conversion blockers,
          performance issues, and trust gaps in STR websites.
        </p>

        {/* Stats */}
        <div className="mb-10 flex justify-center gap-8 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-fd-foreground">33</div>
            <div className="text-fd-muted-foreground">Rules</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-fd-foreground">7</div>
            <div className="text-fd-muted-foreground">Categories</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-fd-foreground">100%</div>
            <div className="text-fd-muted-foreground">Deterministic</div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex justify-center gap-4">
          <Link
            href="/docs/all-rules"
            className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-medium text-white shadow-lg transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(90deg, #5753c6 0%, #ca244d 100%)' }}
          >
            View All Rules
          </Link>
          <Link
            href="/docs"
            className="inline-flex items-center justify-center rounded-lg border border-fd-border bg-fd-background px-6 py-3 text-sm font-medium text-fd-foreground shadow-sm transition-all hover:bg-fd-muted"
          >
            Read the Docs
          </Link>
        </div>

        {/* Quick Links */}
        <div className="mt-16 grid grid-cols-2 gap-4 text-left max-w-lg mx-auto">
          <Link href="/docs/all-rules" className="group rounded-lg border border-fd-border p-4 hover:border-fd-primary transition-colors">
            <h3 className="font-semibold text-fd-foreground group-hover:text-fd-primary">All Rules</h3>
            <p className="text-sm text-fd-muted-foreground">Single table overview</p>
          </Link>
          <Link href="/docs/agents" className="group rounded-lg border border-fd-border p-4 hover:border-fd-primary transition-colors">
            <h3 className="font-semibold text-fd-foreground group-hover:text-fd-primary">Agent Reference</h3>
            <p className="text-sm text-fd-muted-foreground">For AI implementers</p>
          </Link>
          <Link href="/docs/scoring" className="group rounded-lg border border-fd-border p-4 hover:border-fd-primary transition-colors">
            <h3 className="font-semibold text-fd-foreground group-hover:text-fd-primary">Scoring</h3>
            <p className="text-sm text-fd-muted-foreground">How scores work</p>
          </Link>
          <Link href="/docs/specs/analytics-tracking" className="group rounded-lg border border-fd-border p-4 hover:border-fd-primary transition-colors">
            <h3 className="font-semibold text-fd-foreground group-hover:text-fd-primary">Specs</h3>
            <p className="text-sm text-fd-muted-foreground">Implementation details</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
