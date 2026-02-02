import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="mb-4 text-4xl font-bold">GetHost.AI</h1>
        <p className="mb-8 text-lg text-muted-foreground">
          Website diagnostic tool for short-term rental properties. Evidence-based
          audits that identify conversion blockers, performance issues, and trust gaps.
        </p>
        <Link
          href="/docs"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
        >
          Read the Documentation
        </Link>
      </div>
    </main>
  );
}
