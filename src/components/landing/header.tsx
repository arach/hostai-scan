"use client"

import Link from "next/link"
import { Activity } from "lucide-react"

interface HeaderProps {
  /** Brand name shown in header */
  brandName?: string
  /** Link to main HostAI site */
  hostaiUrl?: string
}

export function Header({
  brandName = "GetHost",
  hostaiUrl = "https://hostai.app"
}: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60"
      style={{ borderColor: "#e0e4e6" }} // gray-5
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-[10px] transition-transform group-hover:scale-105"
            style={{ background: "linear-gradient(90deg, #5753c6 0%, #ca244d 100%)" }}
          >
            <Activity className="h-5 w-5 text-white" strokeWidth={1.5} />
          </div>
          <span
            className="text-xl font-normal tracking-tight"
            style={{ color: "#001821", letterSpacing: "-0.01em" }}
          >
            {brandName}
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="#features"
            className="text-sm transition-colors hover:opacity-100"
            style={{ color: "#61686b" }} // gray-11
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="text-sm transition-colors hover:opacity-100"
            style={{ color: "#61686b" }}
          >
            How It Works
          </Link>
          <Link
            href={hostaiUrl}
            target="_blank"
            className="rounded-[10px] px-4 py-2.5 text-sm font-normal text-white transition-all hover:opacity-90 hover:shadow-md"
            style={{
              background: "linear-gradient(90deg, #5753c6 0%, #ca244d 100%)",
              boxShadow: "0px 1px 1px -0.5px rgba(0, 0, 0, 0.05)",
            }}
          >
            Get HostAI
          </Link>
        </nav>

        {/* Mobile menu button - simplified */}
        <button
          className="flex h-9 w-9 items-center justify-center rounded-[10px] md:hidden"
          style={{ background: "#f9fafb", border: "1px solid #e0e4e6" }}
          aria-label="Menu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#001821" strokeWidth="1.5">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </header>
  )
}
