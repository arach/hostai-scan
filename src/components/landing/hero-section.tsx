"use client"

import { ArrowRight, Search, Loader2 } from "lucide-react"

interface HeroSectionProps {
  domain: string
  setDomain: (domain: string) => void
  onSubmit: (e: React.FormEvent) => void
  isLoading: boolean
  error: string
}

export function HeroSection({
  domain,
  setDomain,
  onSubmit,
  isLoading,
  error
}: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      {/* Subtle gradient background */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: "linear-gradient(180deg, #f9fafb 0%, #fff 100%)",
        }}
      />

      {/* Decorative gradient blob */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 opacity-30 blur-3xl"
        style={{
          background: "linear-gradient(90deg, #cbcdff 0%, #f8bfc8 100%)",
        }}
      />

      <div className="mx-auto max-w-4xl text-center">
        {/* Badge */}
        <div
          className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm"
          style={{
            background: "#f9fafb",
            border: "1px solid #e0e4e6",
            color: "#61686b",
          }}
        >
          <span
            className="flex h-2 w-2 rounded-full"
            style={{ background: "linear-gradient(90deg, #5753c6 0%, #ca244d 100%)" }}
          />
          Free Website Audit for STR Properties
        </div>

        {/* Headline */}
        <h1
          className="mb-6 text-balance text-4xl font-normal sm:text-5xl lg:text-6xl"
          style={{
            color: "#001821",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}
        >
          Discover what's blocking your{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: "linear-gradient(90deg, #5753c6 0%, #ca244d 100%)",
            }}
          >
            bookings
          </span>
        </h1>

        {/* Subheadline */}
        <p
          className="mx-auto mb-10 max-w-2xl text-pretty text-lg lg:text-xl"
          style={{
            color: "#61686b",
            lineHeight: 1.6,
          }}
        >
          Get a comprehensive, AI-powered audit of your short-term rental website.
          Uncover conversion issues, SEO problems, and trust gaps in under 60 seconds.
        </p>

        {/* Form */}
        <form onSubmit={onSubmit} className="mx-auto max-w-xl">
          <div className="flex flex-col gap-3 sm:flex-row">
            {/* Input */}
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                style={{ color: "#8b9498" }}
                strokeWidth={1.5}
              />
              <input
                type="text"
                placeholder="Enter your website domain..."
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                disabled={isLoading}
                className="h-12 w-full rounded-[10px] pl-10 pr-4 text-base outline-none transition-shadow disabled:opacity-50"
                style={{
                  border: "1px solid #e0e4e6",
                  color: "#001821",
                  background: "#fff",
                }}
                onFocus={(e) => {
                  e.target.style.boxShadow = "0px 0px 0px 3px rgba(7, 36, 43, 0.09)"
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = "none"
                }}
              />
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex h-12 items-center justify-center gap-2 rounded-[10px] px-6 text-sm font-normal text-white transition-all hover:opacity-90 hover:shadow-lg disabled:opacity-50"
              style={{
                background: "linear-gradient(90deg, #5753c6 0%, #ca244d 100%)",
                boxShadow: "0px 1px 1px -0.5px rgba(0, 0, 0, 0.05)",
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
                  Analyzing...
                </>
              ) : (
                <>
                  Start Free Audit
                  <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                </>
              )}
            </button>
          </div>

          {/* Error message */}
          {error && (
            <p className="mt-2 text-sm" style={{ color: "#64172b" }}>
              {error}
            </p>
          )}

          {/* Helper text */}
          <p className="mt-4 text-sm" style={{ color: "#8b9498" }}>
            No signup required. Your report will be ready in about 60 seconds.
          </p>
        </form>
      </div>
    </section>
  )
}
