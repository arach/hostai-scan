"use client"

/**
 * Partners/Integrations logo bar
 * Shows compatibility with leading STR solutions
 */
export function PartnersSection() {
  return (
    <section
      className="relative py-16 overflow-hidden"
      style={{ background: "#0a1628" }}
    >
      {/* Subtle arc lines in background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] opacity-[0.08]"
          viewBox="0 0 800 400"
          fill="none"
        >
          <circle cx="400" cy="600" r="300" stroke="currentColor" strokeWidth="1" className="text-white" />
          <circle cx="400" cy="600" r="400" stroke="currentColor" strokeWidth="1" className="text-white" />
          <circle cx="400" cy="600" r="500" stroke="currentColor" strokeWidth="1" className="text-white" />
        </svg>
      </div>

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <p
          className="text-center text-sm tracking-wide mb-10"
          style={{ color: "#6b7a8f" }}
        >
          Works with leading Short Term Rentals solutions
        </p>

        {/* Logo row */}
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 md:gap-x-16">
          {/* Guesty */}
          <div className="flex items-center gap-2" style={{ color: "#6b7a8f" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3L4 9v12h5v-7h6v7h5V9l-8-6z" />
            </svg>
            <span className="text-xl font-medium tracking-tight">Guesty</span>
          </div>

          {/* Hostaway */}
          <div style={{ color: "#6b7a8f" }}>
            <span className="text-xl italic font-light tracking-tight">Hostaway</span>
          </div>

          {/* Hostfully */}
          <div style={{ color: "#6b7a8f" }}>
            <span className="text-xl font-bold tracking-tight">Hostfully</span>
          </div>

          {/* VRMA */}
          <div className="flex items-center gap-0.5" style={{ color: "#6b7a8f" }}>
            <span className="text-xl font-semibold tracking-wide">VRMA</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7L8 5z" />
            </svg>
          </div>

          {/* Google */}
          <div style={{ color: "#6b7a8f" }}>
            <span className="text-xl font-normal tracking-tight">Google</span>
          </div>
        </div>
      </div>
    </section>
  )
}
